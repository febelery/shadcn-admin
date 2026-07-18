import { graphlib, layout as dagreLayout } from '@dagrejs/dagre'
import type { FlowGraph, FlowGraphNode } from '../../core/logic/flow-graph'

const FLOW_LAYOUT_PADDING = 48
const FLOW_LAYOUT_ROW_GAP = 34
const FLOW_LAYOUT_ROW_GAP_COMPACT = 24

export const FLOW_CARD_WIDTH = {
  default: 236,
  compact: 196,
} as const

export interface FlowLayoutResult {
  positions: Map<string, { x: number; y: number }>
  columns: number
  compact: boolean
}

export function layoutFlowGraph(graph: FlowGraph): FlowLayoutResult {
  const questionNodeIds = graph.nodes
    .filter((node) => node.kind === 'question')
    .map((node) => node.id)
  const orderedNodeIds = getOrderedFlowNodeIds(graph, questionNodeIds)
  return layoutFlowGraphAdaptive(graph, orderedNodeIds)
}

function flowLaneWidth(compact: boolean) {
  return compact ? FLOW_CARD_WIDTH.compact : FLOW_CARD_WIDTH.default
}

export function flowNodeDimensions(
  node: FlowGraphNode,
  compact: boolean
): { w: number; h: number } {
  const width = flowLaneWidth(compact)
  switch (node.kind) {
    case 'start':
    case 'end':
      return { w: width, h: compact ? 56 : 62 }
    case 'question':
      return { w: width, h: compact ? 72 : 88 }
  }
}

function layoutFlowGraphAdaptive(
  graph: FlowGraph,
  orderedNodeIds: string[]
): FlowLayoutResult {
  const compact = orderedNodeIds.length > 14

  if (graph.edges.some((edge) => edge.kind !== 'default')) {
    return layoutFlowGraphWithDagre(graph, orderedNodeIds, compact)
  }

  const gapY = compact ? FLOW_LAYOUT_ROW_GAP_COMPACT : FLOW_LAYOUT_ROW_GAP
  const laneWidth = flowLaneWidth(compact)
  const positions = new Map<string, { x: number; y: number }>()
  let y = FLOW_LAYOUT_PADDING

  for (const id of orderedNodeIds) {
    const node = graph.nodes.find((item) => item.id === id)
    if (!node) continue
    const { w, h } = flowNodeDimensions(node, compact)
    const x = FLOW_LAYOUT_PADDING + (laneWidth - w) / 2
    positions.set(id, { x, y })
    y += h + gapY
  }

  return { positions, columns: 1, compact }
}

function layoutFlowGraphWithDagre(
  graph: FlowGraph,
  orderedNodeIds: string[],
  compact: boolean
): FlowLayoutResult {
  const dagreGraph = new graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'TB',
    align: 'UL',
    ranksep: compact ? 30 : 44,
    nodesep: compact ? 42 : 68,
    edgesep: compact ? 14 : 20,
    marginx: FLOW_LAYOUT_PADDING,
    marginy: FLOW_LAYOUT_PADDING,
  })

  for (const id of orderedNodeIds) {
    const node = graph.nodes.find((item) => item.id === id)
    if (!node) continue
    const { w, h } = flowNodeDimensions(node, compact)
    dagreGraph.setNode(id, { width: w, height: h })
  }

  for (const edge of graph.edges) {
    if (!dagreGraph.hasNode(edge.source) || !dagreGraph.hasNode(edge.target)) {
      continue
    }
    const isDefault = edge.kind === 'default'
    dagreGraph.setEdge(edge.source, edge.target, {
      weight: isDefault ? 10 : 1,
      minlen: isDefault ? 1 : 2,
    })
  }

  dagreLayout(dagreGraph)

  const positions = new Map<string, { x: number; y: number }>()
  const lanes = new Set<number>()
  for (const id of orderedNodeIds) {
    const node = graph.nodes.find((item) => item.id === id)
    const positioned = dagreGraph.node(id)
    if (!node || !positioned) continue
    const { w, h } = flowNodeDimensions(node, compact)
    const x = Math.max(FLOW_LAYOUT_PADDING, positioned.x - w / 2)
    const y = Math.max(FLOW_LAYOUT_PADDING, positioned.y - h / 2)
    lanes.add(Math.round(x / 24))
    positions.set(id, { x, y })
  }

  return {
    positions,
    columns: Math.max(1, lanes.size),
    compact,
  }
}

function getOrderedFlowNodeIds(
  graph: FlowGraph,
  questionNodeIds: string[]
): string[] {
  const start = graph.nodes.find((node) => node.kind === 'start')?.id
  const end = graph.nodes.find((node) => node.kind === 'end')?.id
  return [...(start ? [start] : []), ...questionNodeIds, ...(end ? [end] : [])]
}
