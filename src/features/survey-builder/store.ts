import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/react/shallow'
import { getQuestion } from './question-types'
import {
  isQuestionNode,
  type SurveySchema,
  type QuestionNode,
  type SurveyMeta,
  type LogicRule,
  type CrossValidation,
  type NodeType,
  type BuilderMode,
  type InspectorTarget,
  type NodeConfig,
} from './types'

// 使用较大的 BASE 保证插入余量。
// normalizeOrders 在 reorderNodes 后重置，防止浮点数无限细分或超大值。
const ORDER_GAP = 10_000

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

export function createEmptySurvey(title = '未命名问卷'): SurveySchema {
  return {
    id: crypto.randomUUID(),
    version: '1',
    meta: {
      ...DEFAULT_META,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    nodes: [],
    logic: [],
    validations: [],
    extensions: {},
  }
}

interface SurveySlice {
  surveyId: string | null
  meta: SurveyMeta
  nodes: QuestionNode[]
  logic: LogicRule[]
  validations: CrossValidation[]
  version: string
  extensions: Record<string, unknown>
  isDirty: boolean

  initSurvey: (data: SurveySchema) => void
  updateMeta: (patch: Partial<SurveyMeta>) => void
  addNode: (
    type: NodeType,
    options?: { afterId?: string | null; atTop?: boolean }
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
  builderMode: BuilderMode
  inspectorTarget: InspectorTarget
  selectedNodeId: string | null
  activeRuleId: string | null
  slashOpen: boolean
  slashAnchor: { x: number; y: number } | null

  setBuilderMode: (mode: BuilderMode) => void
  setInspectorTarget: (target: InspectorTarget) => void
  selectNode: (id: string | null) => void
  setActiveRule: (id: string | null) => void
  openSlash: (anchor: { x: number; y: number }) => void
  closeSlash: () => void
}

type BuilderState = SurveySlice & UISlice

const createSurveySlice = (set: any): SurveySlice => ({
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
      state.surveyId = surveyData.id
      state.meta = surveyData.meta
      state.nodes = surveyData.nodes ?? []
      state.logic = surveyData.logic ?? []
      state.validations = surveyData.validations ?? []
      state.version = surveyData.version ?? '1'
      state.extensions = surveyData.extensions ?? {}
      state.isDirty = false
    }),

  updateMeta: (patch) =>
    set((state: SurveySlice) => {
      Object.assign(state.meta, patch)
      state.isDirty = true
    }),

  addNode: (type, options) =>
    set((state: BuilderState) => {
      // 1. 优先尝试从新系统获取题型能力定义
      const q = getQuestion(type)
      const sorted = [...state.nodes].sort((a, b) => a.order - b.order)
      const maxOrder = sorted.length > 0 ? sorted[sorted.length - 1].order : 0

      const newNode = {
        ...q.create(),
        id: crypto.randomUUID(),
        order: 0,
        validations: [],
        extensions: {},
      } as QuestionNode

      // 2. 统一处理排版逻辑 (保持原有行为不变)
      if (options?.atTop) {
        const first = sorted[0]
        newNode.order = first ? first.order / 2 : ORDER_GAP
      } else if (options?.afterId) {
        const idx = sorted.findIndex((n) => n.id === options.afterId)
        if (idx !== -1) {
          const current = sorted[idx]
          const next = sorted[idx + 1]
          newNode.order = next
            ? (current.order + next.order) / 2
            : current.order + ORDER_GAP
        } else {
          newNode.order = maxOrder + ORDER_GAP
        }
      } else {
        newNode.order = maxOrder + ORDER_GAP
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
      const sorted = [...state.nodes].sort((a, b) => a.order - b.order)
      const idx = sorted.findIndex((n) => n.id === id)
      if (idx === -1) return

      const node = sorted[idx]
      const nextNode = sorted[idx + 1]
      const newOrder = nextNode
        ? (node.order + nextNode.order) / 2
        : node.order + ORDER_GAP

      // 架构层解决方案：深拷贝并递归重生所有子元素 ID
      const cloneWithNewIds = (o: any): any => {
        if (Array.isArray(o)) return o.map(cloneWithNewIds)
        if (o !== null && typeof o === 'object') {
          const res: any = {}
          for (const k in o) {
            if (k === 'id' && typeof o[k] === 'string') res[k] = crypto.randomUUID()
            else res[k] = cloneWithNewIds(o[k])
          }
          return res
        }
        return o
      }

      const newNode: QuestionNode = {
        ...cloneWithNewIds(node),
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

  // 修复：reorderNodes 之后立即 normalizeOrders，
  // 防止长时间使用后 order 值无限增大或出现浮点精度问题。
  reorderNodes: (ids) =>
    set((state: SurveySlice) => {
      ids.forEach((id, i) => {
        const node = state.nodes.find((n) => n.id === id)
        if (node) node.order = (i + 1) * ORDER_GAP
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
        : target.order + ORDER_GAP
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

const createUISlice = (set: any): UISlice => ({
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
  immer((set) => ({
    ...createSurveySlice(set),
    ...createUISlice(set),
  }))
)

export const useSelectedNode = () => {
  const nodes = useBuilderStore((s) => s.nodes)
  const id = useBuilderStore((s) => s.selectedNodeId)
  return nodes.find((n) => n.id === id) ?? null
}

export const useRootNodes = () =>
  useBuilderStore(
    useShallow((s) => [...(s.nodes ?? [])].sort((a, b) => a.order - b.order))
  )

export const useVisibleNodeNumber = () =>
  useBuilderStore(
    useShallow((s) => {
      const numMap: Record<string, number> = {}
      let i = 0
      ;[...(s.nodes ?? [])]
        .filter((n: QuestionNode) => isQuestionNode(n.type))
        .sort((a, b) => a.order - b.order)
        .forEach((n: QuestionNode) => {
          i++
          numMap[n.id] = i
        })
      return numMap
    })
  )
