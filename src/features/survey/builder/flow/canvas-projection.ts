import { MarkerType, type Edge } from '@xyflow/react'
import type { FlowGraphEdge } from '../../core/logic/flow-graph'
import { flowNodeDimensions } from './layout'
import type { FlowCanvasNode, NodeData } from './nodes'
import type { FlowProjection } from './projection'

export const FLOW_END_EDGE_COLOR = 'rgb(37 99 235)'

export type FlowEdgeData = Record<string, unknown> & {
  kind: FlowGraphEdge['kind']
  ruleId?: string
  label?: string
  labelOffsetX?: number
  labelOffsetY?: number
}

export type FlowCanvasEdge = Edge<FlowEdgeData, 'flowRule'>

export interface FlowCanvasProjection {
  baseNodes: FlowCanvasNode[]
  edges: FlowCanvasEdge[]
  layoutMeta: { columns: number; compact: boolean }
}

export function getFlowEdgeStyle(
  kind: FlowGraphEdge['kind'],
  selected: boolean
): React.CSSProperties {
  switch (kind) {
    case 'jump':
      return {
        stroke: 'var(--primary)',
        strokeWidth: selected ? 3 : 2.25,
      }
    case 'end':
      return {
        stroke: FLOW_END_EDGE_COLOR,
        strokeWidth: selected ? 3 : 2.25,
      }
    case 'visibility':
      return {
        stroke: 'rgb(217 119 6)',
        strokeWidth: selected ? 2.75 : 1.75,
        strokeDasharray: '5 5',
        opacity: selected ? 1 : 0.78,
      }
    default:
      return {
        stroke: 'var(--muted-foreground)',
        strokeWidth: selected ? 2 : 1.5,
        opacity: selected ? 0.8 : 0.38,
      }
  }
}

export function createFlowCanvasProjection(
  projection: FlowProjection | null,
  visibility: { showJump: boolean; showVisibility: boolean }
): FlowCanvasProjection {
  if (!projection) {
    return {
      baseNodes: [],
      edges: [],
      layoutMeta: { columns: 1, compact: false },
    }
  }

  const { graph, layout, issueSeverityByTarget } = projection
  const { positions, columns, compact } = layout
  const nodeRects = new Map<
    string,
    { x: number; y: number; w: number; h: number }
  >()
  const baseNodes: FlowCanvasNode[] = graph.nodes.map((node) => {
    const position = positions.get(node.id) ?? { x: 0, y: 0 }
    const issueSeverity = node.elementId
      ? issueSeverityByTarget.get(node.elementId)
      : undefined
    const { w, h } = flowNodeDimensions(node, compact)
    nodeRects.set(node.id, { x: position.x, y: position.y, w, h })
    const data: NodeData = {
      ...node,
      compact,
      hasError: issueSeverity === 'error',
      hasWarn: issueSeverity === 'warn',
    }
    return {
      id: node.id,
      type: 'graphNode',
      position,
      width: w,
      height: h,
      data,
      draggable: false,
    }
  })

  const labelSlots = createEdgeLabelSlots(graph.edges, nodeRects)
  const edges: FlowCanvasEdge[] = graph.edges
    .filter((edge) => {
      if (edge.kind === 'visibility') return visibility.showVisibility
      if (edge.kind === 'jump' || edge.kind === 'end') {
        return visibility.showJump
      }
      return true
    })
    .map((edge) => {
      const labelOffset = labelSlots.get(edge.id)
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        ...edgeHandles(edge.kind),
        type: 'flowRule',
        animated: edge.kind === 'jump' || edge.kind === 'end',
        style: getFlowEdgeStyle(edge.kind, false),
        interactionWidth: edge.kind === 'default' ? 12 : 24,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: markerColor(edge.kind),
        },
        data: {
          ruleId: edge.ruleId,
          kind: edge.kind,
          label: edge.kind === 'default' ? undefined : edge.label,
          labelOffsetX: labelOffset?.x,
          labelOffsetY: labelOffset?.y,
        },
      }
    })

  return { baseNodes, edges, layoutMeta: { columns, compact } }
}

function createEdgeLabelSlots(
  edges: FlowGraphEdge[],
  nodeRects: Map<string, { x: number; y: number; w: number; h: number }>
) {
  const labelSlots = new Map<string, { x: number; y: number }>()
  const grouped = new Map<string, FlowGraphEdge[]>()
  for (const edge of edges) {
    if (edge.kind === 'default') continue
    const list = grouped.get(edge.source) ?? []
    list.push(edge)
    grouped.set(edge.source, list)
  }

  for (const edgesForSource of grouped.values()) {
    const sorted = [...edgesForSource].sort((left, right) => {
      const leftTarget = nodeRects.get(left.target)
      const rightTarget = nodeRects.get(right.target)
      if (!leftTarget || !rightTarget) return 0
      const leftY = leftTarget.y + leftTarget.h / 2
      const rightY = rightTarget.y + rightTarget.h / 2
      if (leftY !== rightY) return leftY - rightY
      return (
        leftTarget.x + leftTarget.w / 2 - (rightTarget.x + rightTarget.w / 2)
      )
    })

    sorted.forEach((edge, index) => {
      const source = nodeRects.get(edge.source)
      const target = nodeRects.get(edge.target)
      if (!source || !target) return
      const deltaX = target.x + target.w / 2 - (source.x + source.w / 2)
      const deltaY = target.y + target.h / 2 - (source.y + source.h / 2)
      const vertical = Math.abs(deltaY) >= Math.abs(deltaX)
      const direction = index % 2 === 0 ? 1 : -1
      const distance = 14 + Math.floor(index / 2) * 12
      labelSlots.set(edge.id, {
        x: vertical ? direction * distance : 0,
        y: vertical ? 0 : direction * distance,
      })
    })
  }

  return labelSlots
}

function markerColor(kind: FlowGraphEdge['kind']): string {
  if (kind === 'end') return FLOW_END_EDGE_COLOR
  if (kind === 'jump') return 'var(--primary)'
  if (kind === 'visibility') return 'rgb(217 119 6)'
  return 'var(--muted-foreground)'
}

function edgeHandles(kind: FlowGraphEdge['kind']) {
  if (kind === 'default') {
    return { sourceHandle: 'out-bottom', targetHandle: 'in-top' }
  }
  if (kind === 'visibility') {
    return { sourceHandle: 'out-left', targetHandle: 'in-left' }
  }
  return { sourceHandle: 'out-right', targetHandle: 'in-right' }
}
