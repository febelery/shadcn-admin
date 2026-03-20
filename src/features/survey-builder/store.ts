import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { immer } from 'zustand/middleware/immer'
import type {
  SurveySchema,
  QuestionNode,
  SurveyMeta,
  LogicRule,
  CrossValidation,
  NodeType,
  BuilderMode,
  ContextMode,
  NodeConfig,
} from './types'
import { QUESTION_TYPE_MAP } from './constants'

const DEFAULT_META: SurveyMeta = {
  title: '未命名问卷',
  description: '',
  coverType: 'color',
  coverColor: 'hsl(0 0% 9%)',
  cover: undefined,
  fontColor: '#ffffff',
  mode: 'scroll',
  status: 'draft',
  cardConfig: { transition: 'slide', progressType: 'dots', allowBack: true },
  submitLabel: '提交',
  endTitle: '感谢您的参与！',
  endDescription: '您的回答已成功提交。',
  submissionRules: {
    dailyLimit: { enabled: false, limit: 1, identifyBy: 'ip' },
    quota: { enabled: false, total: 1000, onExceed: 'close' },
    timeWindow: { enabled: false, onExpire: 'show_closed' },
    ipDedup: { enabled: false, limit: 1, onExceed: 'reject' },
    login: { enabled: false, method: 'system', oncePerAccount: true },
  },
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

interface BuilderState {
  // Data
  surveyId: string | null
  meta: SurveyMeta
  schema: QuestionNode[]
  logic: LogicRule[]
  validations: CrossValidation[]
  version: string
  extensions: Record<string, unknown>
  // UI state
  builderMode: BuilderMode
  contextMode: ContextMode
  selectedNodeId: string | null
  activeRuleId: string | null
  slashOpen: boolean
  slashAnchor: { x: number; y: number } | null
  isDirty: boolean
  isSaving: boolean
  // History
  history: QuestionNode[][]
  historyIndex: number
}

interface BuilderActions {
  // Init
  initSurvey: (schema: SurveySchema) => void
  // Meta
  updateMeta: (patch: Partial<SurveyMeta>) => void
  // Nodes
  addNode: (
    type: NodeType,
    options?: string | { afterId?: string; beforeId?: string; atTop?: boolean }
  ) => void
  removeNode: (id: string) => void
  duplicateNode: (id: string) => void
  updateNode: (id: string, patch: Partial<QuestionNode>) => void
  updateNodeConfig: (id: string, config: Partial<NodeConfig>) => void
  reorderNodes: (ids: string[]) => void
  moveNodeAfter: (nodeId: string, targetId: string) => void
  // Selection
  selectNode: (id: string | null) => void
  // Context
  setBuilderMode: (mode: BuilderMode) => void
  setContextMode: (mode: ContextMode) => void
  // Logic
  addRule: (rule: Omit<LogicRule, 'id'>) => void
  updateRule: (id: string, patch: Partial<LogicRule>) => void
  removeRule: (id: string) => void
  setActiveRule: (id: string | null) => void
  // Slash command
  openSlash: (anchor: { x: number; y: number }) => void
  closeSlash: () => void
  // Save
  markSaved: () => void
  setIsSaving: (isSaving: boolean) => void
  // History
  undo: () => void
  redo: () => void
}

const MAX_HISTORY = 50

// 为了支持 immer 的写法但又不依赖外部 immer (如果该版本 zustand 没带)，可以用 standard zustand 写法。
// 这里的 immer 是 zustand 的 middleware。如果 lint 报找不到 module，可能是没安装。
// 但由于 state 结构较深，我们暂时保留 immer 语法并假设已安装或将要安装。
export const useBuilderStore = create<BuilderState & BuilderActions>()(
  immer((set) => ({
    // 初始状态
    surveyId: null,
    meta: DEFAULT_META,
    schema: [],
    logic: [],
    validations: [],
    version: '1',
    extensions: {},
    builderMode: 'build',
    contextMode: 'survey',
    selectedNodeId: null,
    activeRuleId: null,
    slashOpen: false,
    slashAnchor: null,
    isDirty: false,
    isSaving: false,
    history: [[]],
    historyIndex: 0,

    // 初始化操作
    initSurvey: (surveySchema) =>
      set((state) => {
        state.surveyId = surveySchema.id
        state.meta = surveySchema.meta
        state.schema = surveySchema.schema
        state.logic = surveySchema.logic
        state.validations = surveySchema.validations
        state.version = surveySchema.version || '1'
        state.extensions = surveySchema.extensions || {}
        state.history = [surveySchema.schema]
        state.historyIndex = 0
        state.isDirty = false
      }),

    // 元数据操作
    updateMeta: (patch) =>
      set((state) => {
        Object.assign(state.meta, patch)
        state.isDirty = true
      }),

    // 节点（题目）操作
    addNode: (type, options) =>
      set((state) => {
        const typeConfig = QUESTION_TYPE_MAP[type]
        const maxOrder = state.schema.reduce((m, n) => Math.max(m, n.order), 0)
        const newNode: QuestionNode = {
          id: crypto.randomUUID(),
          type,
          parentId: null,
          order: maxOrder + 1000,
          title: typeConfig?.label ?? type,
          description: '',
          required: false,
          hidden: false,
          readonly: false,
          defaultValue: undefined,
          role: null,
          config: (typeConfig?.defaultConfig ?? {}) as NodeConfig,
          validations: [],
          extensions: {},
        }

        const opts = typeof options === 'string' ? { afterId: options } : options
        const atTop = opts?.atTop
        const afterId = opts?.afterId
        const beforeId = opts?.beforeId

        if (atTop) {
          const first = state.schema[0]
          newNode.order = first ? first.order / 2 : 1000
        } else if (beforeId) {
          const idx = state.schema.findIndex((n) => n.id === beforeId)
          if (idx !== -1) {
            const current = state.schema[idx]
            const prev = state.schema[idx - 1]
            newNode.order = prev
              ? (prev.order + current.order) / 2
              : current.order / 2
          }
        } else if (afterId) {
          const idx = state.schema.findIndex((n) => n.id === afterId)
          if (idx !== -1) {
            const current = state.schema[idx]
            const next = state.schema[idx + 1]
            newNode.order = next
              ? (current.order + next.order) / 2
              : current.order + 1000
          }
        }
        state.schema.push(newNode)
        state.schema.sort((a, b) => a.order - b.order)
        state.selectedNodeId = newNode.id
        state.contextMode = 'question'
        state.isDirty = true

        // Push history
        const h = state.history.slice(0, state.historyIndex + 1)
        h.push([...state.schema])
        if (h.length > MAX_HISTORY) h.shift()
        state.history = h
        state.historyIndex = h.length - 1
      }),

    removeNode: (id) =>
      set((state) => {
        state.schema = state.schema.filter((n) => n.id !== id && n.parentId !== id)
        if (state.selectedNodeId === id) {
          state.selectedNodeId = null
          state.contextMode = 'survey'
        }
        state.isDirty = true
      }),

    duplicateNode: (id) =>
      set((state) => {
        const node = state.schema.find((n) => n.id === id)
        if (!node) return
        const children = state.schema.filter((n) => n.parentId === id)
        const maxOrder = state.schema.reduce((m, n) => Math.max(m, n.order), 0)
        const newNode: QuestionNode = {
          ...node,
          id: crypto.randomUUID(),
          order: maxOrder + 1000,
        }
        state.schema.push(newNode)
        children.forEach((c) =>
          state.schema.push({
            ...c,
            id: crypto.randomUUID(),
            parentId: newNode.id,
            order: c.order,
          })
        )
        state.schema.sort((a, b) => a.order - b.order)
        state.selectedNodeId = newNode.id
        state.isDirty = true
      }),

    updateNode: (id, patch) =>
      set((state) => {
        const node = state.schema.find((n) => n.id === id)
        if (node) {
          Object.assign(node, patch)
          state.isDirty = true
        }
      }),

    updateNodeConfig: (id, config) =>
      set((state) => {
        const node = state.schema.find((n) => n.id === id)
        if (node) {
          Object.assign(node.config, config)
          state.isDirty = true
        }
      }),

    reorderNodes: (ids) =>
      set((state) => {
        ids.forEach((id, i) => {
          const node = state.schema.find((n) => n.id === id)
          if (node) node.order = (i + 1) * 1000
        })
        state.schema.sort((a, b) => a.order - b.order)
        state.isDirty = true
      }),

    moveNodeAfter: (nodeId, targetId) =>
      set((state) => {
        const node = state.schema.find((n) => n.id === nodeId)
        const target = state.schema.find((n) => n.id === targetId)
        if (!node || !target) return
        const sorted = [...state.schema].sort((a, b) => a.order - b.order)
        const targetIdx = sorted.findIndex((n) => n.id === targetId)
        const nextNode = sorted[targetIdx + 1]
        node.order = nextNode
          ? (target.order + nextNode.order) / 2
          : target.order + 1000
        state.schema.sort((a, b) => a.order - b.order)
        state.isDirty = true
      }),

    // 选中态操作
    selectNode: (id) =>
      set((state) => {
        state.selectedNodeId = id
        if (id) {
          state.contextMode = 'question'
        }
      }),

    // 模式切换
    setBuilderMode: (mode) =>
      set((state) => {
        state.builderMode = mode
      }),
    setContextMode: (mode) =>
      set((state) => {
        state.contextMode = mode
      }),

    // 逻辑规则操作
    addRule: (rule) =>
      set((state) => {
        state.logic.push({ ...rule, id: crypto.randomUUID() })
        state.isDirty = true
      }),

    updateRule: (id, patch) =>
      set((state) => {
        const rule = state.logic.find((r) => r.id === id)
        if (rule) {
          Object.assign(rule, patch)
          state.isDirty = true
        }
      }),

    removeRule: (id) =>
      set((state) => {
        state.logic = state.logic.filter((r) => r.id !== id)
        if (state.activeRuleId === id) state.activeRuleId = null
        state.isDirty = true
      }),

    setActiveRule: (id) =>
      set((state) => {
        state.activeRuleId = id
      }),

    // 斜杠命令操作
    openSlash: (anchor) =>
      set((state) => {
        state.slashOpen = true
        state.slashAnchor = anchor
      }),
    closeSlash: () =>
      set((state) => {
        state.slashOpen = false
        state.slashAnchor = null
      }),

    // 保存状态操作
    markSaved: () =>
      set((state) => {
        state.isDirty = false
        state.isSaving = false
      }),
    setIsSaving: (isSaving) =>
      set((state) => {
        state.isSaving = isSaving
      }),

    // 历史记录（撤销/重做）
    undo: () =>
      set((state) => {
        if (state.historyIndex <= 0) return
        state.historyIndex--
        state.schema = [...state.history[state.historyIndex]]
        state.isDirty = true
      }),
    redo: () =>
      set((state) => {
        if (state.historyIndex >= state.history.length - 1) return
        state.historyIndex++
        state.schema = [...state.history[state.historyIndex]]
        state.isDirty = true
      }),
  }))
)

// 选择器（HOOKS）
export const useSelectedNode = () => {
  const schema = useBuilderStore((s) => s.schema)
  const id = useBuilderStore((s) => s.selectedNodeId)
  return schema.find((n) => n.id === id) ?? null
}

export const useRootNodes = () =>
  useBuilderStore(
    useShallow((s) =>
      s.schema.filter((n) => !n.parentId).sort((a, b) => a.order - b.order)
    )
  )

export const useNodeChildren = (parentId: string) =>
  useBuilderStore(
    useShallow((s) =>
      s.schema
        .filter((n) => n.parentId === parentId)
        .sort((a, b) => a.order - b.order)
    )
  )

export const useVisibleNodeNumber = () =>
  useBuilderStore(
    useShallow((s) => {
      const numMap: Record<string, number> = {}
      let i = 0
      s.schema
        .filter((n) => !['block', 'divider', 'rich_text'].includes(n.type))
        .sort((a, b) => a.order - b.order)
        .forEach((n) => {
          i++
          numMap[n.id] = i
        })
      return numMap
    })
  )
