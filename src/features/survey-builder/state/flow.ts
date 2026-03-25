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
import { useDraftStore } from './draft'
import { useSchemaStore } from './schema'
import { useUIStore } from './ui'

interface FlowState {
  flow: FlowRule[]
  validations: CrossValidation[]
  nodes: Node[]
  edges: Edge[]

  addRule: (rule: Omit<FlowRule, 'id'>) => void
  updateRule: (id: string, patch: Partial<FlowRule>) => void
  removeRule: (id: string) => void

  // 核心同步与状态管理 (Controlled Mode)
  setNodes: (updater: (prev: Node[]) => Node[]) => void
  setEdges: (updater: (prev: Edge[]) => Edge[]) => void
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange

  // 业务层同步：将 Schema 数据转化为 React Flow 元素
  syncElements: (
    visibleNodes: QuestionNode[],
    flow: FlowRule[],
    positions: Record<string, { x: number; y: number }>,
    allNodes?: QuestionNode[]
  ) => void
}

export const useFlowStore = create<FlowState>()((set, get) => ({
  flow: [],
  validations: [],
  nodes: [],
  edges: [],

  addRule: (rule) => {
    const newRule = { ...rule, id: crypto.randomUUID() }
    set((state) => ({
      ...state,
      flow: [...state.flow, newRule],
    }))
    useDraftStore.getState().setDirty(true)

    // 同步刷新连线
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
    useDraftStore.getState().setDirty(true)

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
    if (useUIStore.getState().activeRuleId === id) {
      useUIStore.getState().setActiveRule(null)
    }
    useDraftStore.getState().setDirty(true)

    const schema = useSchemaStore.getState()
    get().syncElements(
      schema.nodes.filter((n) => isQuestionNode(n.type)),
      get().flow,
      (schema.extensions.flowPositions as any) || {},
      schema.nodes
    )
  },

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

  syncElements: (visibleNodes, flow, flowPositions, allNodes) => {
    // 1. 构建节点
    const indexMap: Record<string, number> = {}
    let count = 0
    const sorted = [...(allNodes || [])].sort((a, b) => a.order - b.order)
    for (const node of sorted) {
      if (isQuestionNode(node.type)) {
        count++
        indexMap[node.id] = count
      }
    }

    const newNodes: Node[] = visibleNodes.map((node, i) => ({
      id: node.id,
      type: 'questionNode',
      position: flowPositions[node.id] ?? { x: 120, y: i * 140 },
      data: { node, num: indexMap[node.id] },
      width: 220,
      height: 84,
    }))

    // 2. 构建连线
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
