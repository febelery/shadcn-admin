import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'
import { create } from 'zustand'
import {
  type FlowRule,
  type CrossValidation,
  type QuestionNode,
  isQuestionNode,
} from '../types'
import { useSchemaStore } from './schema'
import { useUIStore } from './ui'

/**
 * 逻辑连线域状态维护 (Flow Domain)
 * 职责：管理 React Flow 画布状态（Nodes/Edges）与逻辑规则 (Flow Rules) 的映射同步。
 * 遵循原则：单向同步 (AST -> Elements)、响应式画布操作。
 */

interface FlowState {
  // --- 原始数据 (Domain Data) ---
  flow: FlowRule[]
  validations: CrossValidation[]

  // --- 画布状态 (React Flow State) ---
  nodes: Node[]
  edges: Edge[]

  // --- 规则管理 (Rule Actions) ---
  addRule: (rule: Omit<FlowRule, 'id'>) => void
  updateRule: (id: string, patch: Partial<FlowRule>) => void
  removeRule: (id: string) => void

  // --- 视图与同步逻辑 (View & Sync) ---
  setNodes: (updater: (prev: Node[]) => Node[]) => void
  setEdges: (updater: (prev: Edge[]) => Edge[]) => void
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  syncElements: (
    visibleNodes: QuestionNode[],
    flow: FlowRule[],
    positions: Record<string, { x: number; y: number }>,
    allNodes?: QuestionNode[]
  ) => void
}

export const useFlowStore = create<FlowState>()((set, get) => ({
  // --- 初始化状态 ---
  flow: [],
  validations: [],
  nodes: [],
  edges: [],

  // --- 规则管理 (Rule Actions) ---
  addRule: (rule) => {
    const newRule = { ...rule, id: crypto.randomUUID() }
    set((state) => ({
      ...state,
      flow: [...state.flow, newRule],
    }))

    // 联动刷新画布元素
    const schema = useSchemaStore.getState()
    get().syncElements(
      schema.nodes.filter((n) => isQuestionNode(n.type)),
      get().flow,
      (schema.extensions.flowPositions as any) || {},
      schema.nodes
    )
  },

  updateRule: (id, patch) => {
    set((state) => ({
      ...state,
      flow: state.flow.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))

    const schema = useSchemaStore.getState()
    get().syncElements(
      schema.nodes.filter((n) => isQuestionNode(n.type)),
      get().flow,
      (schema.extensions.flowPositions as any) || {},
      schema.nodes
    )
  },

  removeRule: (id) => {
    set((state) => ({
      ...state,
      flow: state.flow.filter((r) => r.id !== id),
    }))

    // 状态清理：若当前规则正处于编辑状态，则取消激活
    if (useUIStore.getState().activeRuleId === id) {
      useUIStore.getState().setActiveRule(null)
    }

    const schema = useSchemaStore.getState()
    get().syncElements(
      schema.nodes.filter((n) => isQuestionNode(n.type)),
      get().flow,
      (schema.extensions.flowPositions as any) || {},
      schema.nodes
    )
  },

  // --- 画布基础操作 (Canvas Primatives) ---
  setNodes: (updater) =>
    set((state) => ({
      ...state,
      nodes: updater(state.nodes),
    })),

  setEdges: (updater) =>
    set((state) => ({
      ...state,
      edges: updater(state.edges),
    })),

  onNodesChange: (changes) => {
    set((state) => ({
      ...state,
      nodes: applyNodeChanges(changes, state.nodes),
    }))
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      ...state,
      edges: applyEdgeChanges(changes, state.edges),
    }))
  },

  // --- 核心同步引擎 (Sync Engine) ---
  /**
   * 将业务层 Schema 节点与规则同步至 React Flow 画布元素。
   * 此函数通常作为副作用手动触发，以保证视图与 AST 的强一致性。
   */
  syncElements: (visibleNodes, flow, flowPositions, allNodes) => {
    // 1. 建立业务索引字典
    const indexMap: Record<string, number> = {}
    let count = 0
    const sorted = [...(allNodes || [])].sort((a, b) => a.order - b.order)
    for (const node of sorted) {
      if (isQuestionNode(node.type)) {
        count++
        indexMap[node.id] = count
      }
    }

    // 2. 将 QuestionNode 转化为画布节点 (Node[])
    const newNodes: Node[] = visibleNodes.map((node, i) => ({
      id: node.id,
      type: 'questionNode',
      position: flowPositions[node.id] ?? { x: 120, y: i * 140 },
      data: { node, num: indexMap[node.id] },
      width: 220,
      height: 84,
    }))

    // 3. 将 FlowRule 转化为画布连线 (Edge[])
    const newEdges: Edge[] = []
    flow.forEach((rule: any) => {
      if (!rule.enabled) return
      const fromId = (rule.expression as any)?.field
      rule.actions.forEach((action: any) => {
        const toId = action.target
        if (!fromId || !toId || fromId === toId) return
        newEdges.push({
          id: `${rule.id}::${action.type}::${toId}`,
          source: fromId,
          target: toId,
          type: 'flowEdge',
          data: {
            ruleId: rule.id,
            actionType: action.type,
            ruleName: rule.name,
          },
          markerEnd: { type: 'arrowclosed' as any, width: 14, height: 14 },
        })
      })
    })

    set({
      flow,
      nodes: newNodes,
      edges: newEdges,
    })
  },
}))
