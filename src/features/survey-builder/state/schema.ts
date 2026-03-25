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
import {
  ORDER_GAP,
  DEFAULT_META,
  cloneQuestionNode,
  calculateNewOrder,
} from './operations'
import { useUIStore } from './ui'

/**
 * 问卷结构域状态维护 (Schema Domain)
 * 职责：管理问卷的核心 AST 结构（题目节点）、元数据属性及扩展配置。
 * 遵循原则：原子化更新、Immer 可变性糖衣、职责单向流动。
 */

interface SchemaState {
  // --- 基础状态 (Base State) ---
  surveyId: string | null
  meta: SurveyMeta
  nodes: QuestionNode[]
  version: string
  extensions: Record<string, unknown>

  // --- 元数据及全局操作 (Meta Actions) ---
  initSchema: (data: SurveySchema) => void
  updateMeta: (patch: Partial<SurveyMeta>) => void
  updateExtensions: (patch: Record<string, unknown>) => void

  // --- 题目节点操作 (Node CRUD) ---
  addNode: (
    type: NodeType,
    options?: { afterId?: string | null; atTop?: boolean }
  ) => void
  removeNode: (id: string) => void
  duplicateNode: (id: string) => void
  updateNode: (id: string, patch: Partial<QuestionNode>) => void
  updateNodeConfig: (id: string, config: Partial<NodeConfig>) => void

  // --- 布局与排序 (Layout & Order) ---
  reorderNodes: (ids: string[]) => void
  moveNode: (activeId: string, overId: string) => void
  moveNodeAfter: (nodeId: string, targetId: string) => void
}

export const useSchemaStore = create<SchemaState>()(
  immer((set) => ({
    // 初始状态集中定义
    surveyId: null,
    meta: DEFAULT_META,
    nodes: [],
    version: '1',
    extensions: {},

    // --- Meta Actions ---
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
      }),

    updateExtensions: (patch) =>
      set((state) => {
        Object.assign(state.extensions, patch)
      }),

    // ---题目操作 (Node CRUD) ---
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

        // 自动选中新加题目，提升交互体验
        useUIStore.getState().selectNode(newNode.id)
      }),

    removeNode: (id) =>
      set((state) => {
        const idx = state.nodes.findIndex((n) => n.id === id)
        if (idx !== -1) {
          state.nodes.splice(idx, 1)
        }

        // 处理 UI 联动：若被删除节点处于选中态，则重置选中位
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
      }),

    updateNode: (id, patch) =>
      set((state) => {
        const node = state.nodes.find((n) => n.id === id)
        if (node) {
          Object.assign(node, patch)
        }
      }),

    updateNodeConfig: (id, config) =>
      set((state) => {
        const node = state.nodes.find((n) => n.id === id)
        if (node) {
          Object.assign(node.config, config)
        }
      }),

    // --- 排序逻辑 (Layout Logic) ---
    reorderNodes: (ids) =>
      set((state) => {
        // 全量批量排序重排
        ids.forEach((id, i) => {
          const node = state.nodes.find((n) => n.id === id)
          if (node) node.order = (i + 1) * ORDER_GAP
        })
        state.nodes.sort((a, b) => a.order - b.order)
      }),

    moveNode: (activeId, overId) =>
      set((state) => {
        const sorted = [...state.nodes].sort((a, b) => a.order - b.order)
        const oldIdx = sorted.findIndex((n) => n.id === activeId)
        const newIdx = sorted.findIndex((n) => n.id === overId)
        if (oldIdx === -1 || newIdx === -1) return

        // 基于数组位置计算的新排序数组镜像
        const rearranged = [...sorted]
        const [moved] = rearranged.splice(oldIdx, 1)
        rearranged.splice(newIdx, 0, moved)

        // 回写 Order 权重并同步原始状态
        rearranged.forEach((node, i) => {
          const target = state.nodes.find((n) => n.id === node.id)
          if (target) target.order = (i + 1) * ORDER_GAP
        })
        state.nodes.sort((a, b) => a.order - b.order)
      }),

    moveNodeAfter: (nodeId, targetId) =>
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId)
        if (!node) return

        node.order = calculateNewOrder(state.nodes, { afterId: targetId })
        state.nodes.sort((a, b) => a.order - b.order)
      }),
  }))
)
