import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/react/shallow'
import { QUESTION_TYPE_MAP, isQuestionNode } from './constants'
import type {
  SurveySchema,
  QuestionNode,
  SurveyMeta,
  LogicRule,
  CrossValidation,
  NodeType,
  BuilderMode,
  InspectorTarget,
  NodeConfig,
} from './types'

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

interface SurveySlice {
  // Domain Data
  surveyId: string | null
  meta: SurveyMeta
  nodes: QuestionNode[]
  logic: LogicRule[]
  validations: CrossValidation[]
  version: string
  extensions: Record<string, unknown>
  isDirty: boolean

  // Actions
  initSurvey: (data: SurveySchema) => void
  updateMeta: (patch: Partial<SurveyMeta>) => void
  addNode: (
    type: NodeType,
    options?: {
      afterId?: string | null
      atTop?: boolean
    }
  ) => void
  removeNode: (id: string) => void
  duplicateNode: (id: string) => void
  updateNode: (id: string, patch: Partial<QuestionNode>) => void
  updateNodeConfig: (id: string, config: Partial<NodeConfig>) => void
  reorderNodes: (ids: string[]) => void
  moveNodeAfter: (nodeId: string, targetId: string) => void
  addRule: (rule: Omit<LogicRule, 'id'>) => void
  updateRule: (id: string, patch: Partial<LogicRule>) => void
  removeRule: (id: string) => void
  markSaved: () => void
}

interface UISlice {
  // UI State
  builderMode: BuilderMode
  inspectorTarget: InspectorTarget
  selectedNodeId: string | null
  activeRuleId: string | null
  slashOpen: boolean
  slashAnchor: { x: number; y: number } | null

  // Actions
  setBuilderMode: (mode: BuilderMode) => void
  setInspectorTarget: (target: InspectorTarget) => void
  selectNode: (id: string | null) => void
  setActiveRule: (id: string | null) => void
  openSlash: (anchor: { x: number; y: number }) => void
  closeSlash: () => void
}

type BuilderState = SurveySlice & UISlice

const createSurveySlice = (set: any, _get: any, _api: any): SurveySlice => ({
  surveyId: null,
  meta: DEFAULT_META,
  nodes: [],
  logic: [],
  validations: [],
  version: '1',
  extensions: {},
  isDirty: false,

  initSurvey: (surveyData) =>
    set((state: SurveySlice) => {
      const nodes = surveyData.nodes || (surveyData as any).schema || []
      state.surveyId = surveyData.id
      state.meta = surveyData.meta
      state.nodes = nodes
      state.logic = surveyData.logic || []
      state.validations = surveyData.validations || []
      state.version = surveyData.version || '1'
      state.extensions = surveyData.extensions || {}
      state.isDirty = false
    }),

  updateMeta: (patch) =>
    set((state: SurveySlice) => {
      Object.assign(state.meta, patch)
      state.isDirty = true
    }),

  addNode: (type, options) =>
    set((state: BuilderState) => {
      const typeConfig = QUESTION_TYPE_MAP[type]
      const sorted = [...state.nodes].sort((a, b) => a.order - b.order)
      const newNode: QuestionNode = {
        id: crypto.randomUUID(),
        type,
        order: 0,
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

      if (options?.atTop) {
        // 插入到问卷最顶部
        const first = sorted[0]
        newNode.order = first ? first.order / 2 : 1000
      } else if (options?.afterId) {
        // 插入到指定节点之后
        const idx = sorted.findIndex((n) => n.id === options.afterId)
        if (idx !== -1) {
          const current = sorted[idx]
          const next = sorted[idx + 1]
          newNode.order = next
            ? (current.order + next.order) / 2
            : current.order + 1000
        } else {
          newNode.order =
            state.nodes.reduce((m, n) => Math.max(m, n.order), 0) + 1000
        }
      } else {
        // 默认：追加到末尾
        newNode.order =
          state.nodes.reduce((m, n) => Math.max(m, n.order), 0) + 1000
      }

      state.nodes.push(newNode)
      state.nodes.sort((a, b) => a.order - b.order)
      state.selectedNodeId = newNode.id
      state.inspectorTarget = 'node'
      state.isDirty = true
    }),

  removeNode: (id) =>
    set((state: BuilderState) => {
      const idx = state.nodes.findIndex((n) => n.id === id)
      if (idx !== -1) state.nodes.splice(idx, 1)

      if (state.selectedNodeId === id) {
        state.selectedNodeId = null
        state.inspectorTarget = 'survey'
      }
      state.isDirty = true
    }),

  duplicateNode: (id) =>
    set((state: BuilderState) => {
      const idx = state.nodes.findIndex((n) => n.id === id)
      if (idx === -1) return

      const node = state.nodes[idx]
      const nextNode = state.nodes[idx + 1]

      // 插值计算 order，确保在当前节点和下一个节点之间
      const newOrder = nextNode
        ? (node.order + nextNode.order) / 2
        : node.order + 1000

      const newNode: QuestionNode = {
        ...node,
        id: crypto.randomUUID(),
        order: newOrder,
        title: `${node.title} (副本)`,
      }

      state.nodes.push(newNode)
      state.nodes.sort((a, b) => a.order - b.order)
      state.selectedNodeId = newNode.id
      state.isDirty = true
    }),

  updateNode: (id, patch) =>
    set((state: SurveySlice) => {
      const node = state.nodes.find((n) => n.id === id)
      if (node) {
        Object.assign(node, patch)
        state.isDirty = true
      }
    }),

  updateNodeConfig: (id, config) =>
    set((state: SurveySlice) => {
      const node = state.nodes.find((n) => n.id === id)
      if (node) {
        Object.assign(node.config, config)
        state.isDirty = true
      }
    }),

  reorderNodes: (ids) =>
    set((state: SurveySlice) => {
      ids.forEach((id, i) => {
        const node = state.nodes.find((n) => n.id === id)
        if (node) node.order = (i + 1) * 1000
      })
      state.nodes.sort((a, b) => a.order - b.order)
      state.isDirty = true
    }),

  moveNodeAfter: (nodeId, targetId) =>
    set((state: SurveySlice) => {
      const node = state.nodes.find((n) => n.id === nodeId)
      const target = state.nodes.find((n) => n.id === targetId)
      if (!node || !target) return
      const sorted = [...state.nodes].sort((a, b) => a.order - b.order)
      const targetIdx = sorted.findIndex((n) => n.id === targetId)
      const nextNode = sorted[targetIdx + 1]
      node.order = nextNode
        ? (target.order + nextNode.order) / 2
        : target.order + 1000
      state.nodes.sort((a, b) => a.order - b.order)
      state.isDirty = true
    }),

  addRule: (rule) =>
    set((state: SurveySlice) => {
      state.logic.push({ ...rule, id: crypto.randomUUID() })
      state.isDirty = true
    }),

  updateRule: (id, patch) =>
    set((state: SurveySlice) => {
      const rule = state.logic.find((r) => r.id === id)
      if (rule) {
        Object.assign(rule, patch)
        state.isDirty = true
      }
    }),

  removeRule: (id) =>
    set((state: BuilderState) => {
      state.logic = state.logic.filter((r) => r.id !== id)
      if (state.activeRuleId === id) state.activeRuleId = null
      state.isDirty = true
    }),

  markSaved: () =>
    set((state: SurveySlice) => {
      state.isDirty = false
    }),
})

const createUISlice = (set: any, _get: any, _api: any): UISlice => ({
  builderMode: 'build',
  inspectorTarget: 'survey',
  selectedNodeId: null,
  activeRuleId: null,
  slashOpen: false,
  slashAnchor: null,

  setBuilderMode: (mode) =>
    set((state: UISlice) => {
      state.builderMode = mode
    }),
  setInspectorTarget: (target) =>
    set((state: UISlice) => {
      state.inspectorTarget = target
    }),
  selectNode: (id) =>
    set((state: UISlice) => {
      state.selectedNodeId = id
      if (id) state.inspectorTarget = 'node'
    }),
  setActiveRule: (id) =>
    set((state: UISlice) => {
      state.activeRuleId = id
    }),
  openSlash: (anchor) =>
    set((state: UISlice) => {
      state.slashOpen = true
      state.slashAnchor = anchor
    }),
  closeSlash: () =>
    set((state: UISlice) => {
      state.slashOpen = false
      state.slashAnchor = null
    }),
})

export const useBuilderStore = create<BuilderState>()(
  immer((...a) => ({
    ...createSurveySlice(...a),
    ...createUISlice(...a),
  }))
)

// 选择器（HOOKS）
export const useSelectedNode = () => {
  const nodes = useBuilderStore((s) => s.nodes || [])
  const id = useBuilderStore((s) => s.selectedNodeId)
  return nodes.find((n) => n.id === id) ?? null
}

export const useRootNodes = () =>
  useBuilderStore(
    useShallow((s) => [...(s.nodes || [])].sort((a, b) => a.order - b.order))
  )

export const useVisibleNodeNumber = () =>
  useBuilderStore(
    useShallow((s) => {
      const numMap: Record<string, number> = {}
      let i = 0
      ;[...(s.nodes || [])]
        .filter((n: QuestionNode) => isQuestionNode(n.type))
        .sort((a, b) => a.order - b.order)
        .forEach((n: QuestionNode) => {
          i++
          numMap[n.id] = i
        })
      return numMap
    })
  )
