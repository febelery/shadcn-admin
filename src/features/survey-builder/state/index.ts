import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { getQuestion } from '../questions'
import {
  type SurveySchema,
  type QuestionNode,
  type SurveyMeta,
  type FlowRule,
  type CrossValidation,
  type NodeType,
  type BuilderMode,
  type InspectorTarget,
  type NodeConfig,
} from '../types'
import {
  ORDER_GAP,
  DEFAULT_META,
  cloneQuestionNode,
  calculateNewOrder,
} from './operations'

interface SurveySlice {
  surveyId: string | null
  meta: SurveyMeta
  nodes: QuestionNode[]
  flow: FlowRule[]
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
  addRule: (rule: Omit<FlowRule, 'id'>) => void
  updateRule: (id: string, patch: Partial<FlowRule>) => void
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
  flow: [],
  validations: [],
  version: '1',
  extensions: {},
  isDirty: false,

  initSurvey: (surveyData) =>
    set((state: SurveySlice) => {
      state.surveyId = surveyData.id
      state.meta = surveyData.meta
      state.nodes = surveyData.nodes ?? []
      state.flow = surveyData.flow ?? []
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
      const q = getQuestion(type)
      const newNode = {
        ...q.create(),
        id: crypto.randomUUID(),
        order: calculateNewOrder(state.nodes, options),
        validations: [],
        extensions: {},
      } as QuestionNode

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
      const node = state.nodes.find((n) => n.id === id)
      if (!node) return

      const newNode: QuestionNode = {
        ...cloneQuestionNode(node),
        order: calculateNewOrder(state.nodes, { afterId: id }),
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
        if (node) node.order = (i + 1) * ORDER_GAP
      })
      state.nodes.sort((a, b) => a.order - b.order)
      state.isDirty = true
    }),

  moveNodeAfter: (nodeId, targetId) =>
    set((state: SurveySlice) => {
      const node = state.nodes.find((n) => n.id === nodeId)
      if (!node) return

      node.order = calculateNewOrder(state.nodes, { afterId: targetId })
      state.nodes.sort((a, b) => a.order - b.order)
      state.isDirty = true
    }),

  addRule: (rule) =>
    set((state: SurveySlice) => {
      state.flow.push({ ...rule, id: crypto.randomUUID() })
      state.isDirty = true
    }),

  updateRule: (id, patch) =>
    set((state: SurveySlice) => {
      const rule = state.flow.find((r) => r.id === id)
      if (rule) {
        Object.assign(rule, patch)
        state.isDirty = true
      }
    }),

  removeRule: (id) =>
    set((state: BuilderState) => {
      state.flow = state.flow.filter((r) => r.id !== id)
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
