import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { getQuestion } from '../questions'
import {
  type SurveySchema,
  type QuestionNode,
  type SurveyMeta,
  type NodeType,
  type NodeConfig,
} from '../types'
import { useDraftStore } from './draft'
import {
  ORDER_GAP,
  DEFAULT_META,
  cloneQuestionNode,
  calculateNewOrder,
} from './operations'
import { useUIStore } from './ui'

interface SchemaState {
  surveyId: string | null
  meta: SurveyMeta
  nodes: QuestionNode[]
  version: string
  extensions: Record<string, unknown>

  initSchema: (data: SurveySchema) => void
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
  updateExtensions: (patch: Record<string, unknown>) => void
}

export const useSchemaStore = create<SchemaState>()(
  immer((set) => ({
    surveyId: null,
    meta: DEFAULT_META,
    nodes: [],
    version: '1',
    extensions: {},

    initSchema: (surveyData) =>
      set((state) => {
        state.surveyId = surveyData.id
        state.meta = surveyData.meta
        state.nodes = surveyData.nodes ?? []
        state.version = surveyData.version ?? '1'
        state.extensions = surveyData.extensions ?? {}
      }),

    updateMeta: (patch) =>
      set((state) => {
        Object.assign(state.meta, patch)
        useDraftStore.getState().setDirty(true)
      }),

    addNode: (type, options) =>
      set((state) => {
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

        // 联动 UI
        useUIStore.getState().selectNode(newNode.id)
        useDraftStore.getState().setDirty(true)
      }),

    removeNode: (id) =>
      set((state) => {
        const idx = state.nodes.findIndex((n) => n.id === id)
        if (idx !== -1) {
          state.nodes.splice(idx, 1)
          useDraftStore.getState().setDirty(true)
        }

        // 联动 UI
        if (useUIStore.getState().selectedNodeId === id) {
          useUIStore.getState().selectNode(null)
          useUIStore.getState().setInspectorTarget('survey')
        }
      }),

    duplicateNode: (id) =>
      set((state) => {
        const node = state.nodes.find((n) => n.id === id)
        if (!node) return

        const newNode: QuestionNode = {
          ...cloneQuestionNode(node),
          order: calculateNewOrder(state.nodes, { afterId: id }),
          title: `${node.title} (副本)`,
        }

        state.nodes.push(newNode)
        state.nodes.sort((a, b) => a.order - b.order)

        // 联动 UI
        useUIStore.getState().selectNode(newNode.id)
        useDraftStore.getState().setDirty(true)
      }),

    updateNode: (id, patch) =>
      set((state) => {
        const node = state.nodes.find((n) => n.id === id)
        if (node) {
          Object.assign(node, patch)
          useDraftStore.getState().setDirty(true)
        }
      }),

    updateNodeConfig: (id, config) =>
      set((state) => {
        const node = state.nodes.find((n) => n.id === id)
        if (node) {
          Object.assign(node.config, config)
          useDraftStore.getState().setDirty(true)
        }
      }),

    reorderNodes: (ids) =>
      set((state) => {
        ids.forEach((id, i) => {
          const node = state.nodes.find((n) => n.id === id)
          if (node) node.order = (i + 1) * ORDER_GAP
        })
        state.nodes.sort((a, b) => a.order - b.order)
        useDraftStore.getState().setDirty(true)
      }),

    moveNodeAfter: (nodeId, targetId) =>
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId)
        if (!node) return

        node.order = calculateNewOrder(state.nodes, { afterId: targetId })
        state.nodes.sort((a, b) => a.order - b.order)
        useDraftStore.getState().setDirty(true)
      }),

    updateExtensions: (patch) =>
      set((state) => {
        Object.assign(state.extensions, patch)
        useDraftStore.getState().setDirty(true)
      }),
  }))
)
