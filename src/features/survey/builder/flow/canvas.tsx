import { useMemo, useCallback, useEffect, useRef } from 'react'
import {
  BaseEdge,
  ReactFlow,
  Background,
  Controls,
  EdgeLabelRenderer,
  MiniMap,
  MarkerType,
  ReactFlowProvider,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { flowNodeDimensions, START_ID } from '../../core/logic/flow-graph'
import { ruleMatchesSearch } from '../../core/logic/rule-meta'
import { useBuilderStore } from '../store'
import { useRuleAuthoring } from '../store/use-rule-authoring'
import type { Rule, FlowGraphEdge } from '../types'
import './canvas.css'
import { GraphNode, type NodeData } from './nodes'
import type { FlowProjection } from './projection'

const EMPTY_RULES: FlowProjection['rules'] = []
const EMPTY_QUESTION_TITLES: FlowProjection['questionTitles'] = new Map()

const nodeTypes = {
  graphNode: GraphNode,
}

const edgeTypes = {
  flowRule: FlowRuleEdge,
}

const END_EDGE_COLOR = 'rgb(37 99 235)'

type FlowEdgeData = {
  kind: FlowGraphEdge['kind']
  ruleId?: string
  label?: string
  labelOffsetX?: number
  labelOffsetY?: number
}

function FlowRuleEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
  selected,
}: EdgeProps) {
  const edgeData = data as FlowEdgeData | undefined
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
    offset: 24,
  })

  const label = edgeData?.label?.trim()
  const isRuleEdge = !!label && edgeData?.kind !== 'default'
  const offsetX = edgeData?.labelOffsetX ?? 0
  const offsetY = edgeData?.labelOffsetY ?? 0

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {isRuleEdge ? (
        <EdgeLabelRenderer>
          <div
            className='nopan nodrag pointer-events-none absolute'
            style={{
              transform: `translate(-50%, -50%) translate(${labelX + offsetX}px, ${labelY + offsetY}px)`,
            }}
          >
            <div
              className={cn(
                'border-border/70 bg-background/95 text-foreground flex items-center gap-1 rounded-md border px-2 py-1 shadow-sm backdrop-blur-sm',
                selected && 'border-primary/50 shadow-md'
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full',
                  edgeData?.kind === 'jump' && 'bg-primary',
                  edgeData?.kind === 'visibility' && 'bg-amber-600',
                  edgeData?.kind === 'end' && 'bg-blue-600',
                  edgeData?.kind === 'default' && 'bg-muted-foreground'
                )}
              />
              <span className='max-w-44 truncate text-[10px] leading-none font-medium'>
                {label}
              </span>
            </div>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}

function FlowLegend() {
  const items = [
    {
      label: '默认顺序',
      color: 'var(--muted-foreground)',
      dash: false,
    },
    {
      label: '跳题',
      color: 'var(--primary)',
      dash: false,
    },
    {
      label: '显隐',
      color: 'rgb(217 119 6)',
      dash: true,
    },
    {
      label: '结束',
      color: END_EDGE_COLOR,
      dash: false,
    },
  ]

  return (
    <div className='pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2'>
      <div className='border-border/70 bg-background/90 text-muted-foreground flex items-center gap-3 rounded-full border px-3 py-1.5 shadow-sm backdrop-blur-sm'>
        {items.map((item) => (
          <div
            key={item.label}
            className='flex items-center gap-1.5 text-[11px] leading-none'
          >
            <svg
              className='h-3 w-7 shrink-0'
              viewBox='0 0 28 12'
              aria-hidden='true'
            >
              <line
                x1='1'
                y1='6'
                x2='27'
                y2='6'
                stroke={item.color}
                strokeWidth='2'
                strokeLinecap='round'
                strokeDasharray={item.dash ? '4 3' : undefined}
              />
            </svg>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** 边样式 — 使用 React Flow CSS 变量，避免 inline SVG 颜色无效 */
function edgeStyle(
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
        stroke: END_EDGE_COLOR,
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

function markerColor(kind: FlowGraphEdge['kind']): string {
  if (kind === 'end') return END_EDGE_COLOR
  if (kind === 'jump') return 'var(--primary)'
  if (kind === 'visibility') return 'rgb(217 119 6)'
  return 'var(--muted-foreground)'
}

function edgeHandles(kind: FlowGraphEdge['kind']) {
  if (kind === 'default') {
    return {
      sourceHandle: 'out-bottom',
      targetHandle: 'in-top',
    }
  }
  if (kind === 'visibility') {
    return {
      sourceHandle: 'out-left',
      targetHandle: 'in-left',
    }
  }
  return {
    sourceHandle: 'out-right',
    targetHandle: 'in-right',
  }
}

function nodeMatchesSearch(
  data: NodeData,
  query: string,
  questionTitles: Map<string, string>,
  rules: Rule[]
): boolean {
  if (!query.trim()) return true
  const needle = query.trim().toLowerCase()
  if (data.label.toLowerCase().includes(needle)) return true
  if (data.elementId) {
    const title = questionTitles.get(data.elementId)
    if (title?.toLowerCase().includes(needle)) return true
  }
  if (data.elementId) {
    const related = rules.some(
      (r) =>
        ruleMatchesSearch(r, query, questionTitles) &&
        (r.condition.questionId === data.elementId ||
          r.action.target === data.elementId)
    )
    if (related) return true
  }
  return false
}

function ruleTouchesQuestion(rule: Rule, questionId: string) {
  return (
    rule.condition.questionId === questionId ||
    rule.action.target === questionId
  )
}

function pickRuleForQuestion(rules: Rule[], questionId: string): string | null {
  const enabled = rules.filter((r) => r.enabled)
  const outgoing = enabled.find((r) => {
    if (r.condition.questionId !== questionId) return false
    return r.action.type === 'jump_to_question' || r.action.type === 'end'
  })
  if (outgoing) return outgoing.id

  const sourceRule = enabled.find((r) => r.condition.questionId === questionId)
  if (sourceRule) return sourceRule.id

  const targetRule = enabled.find((r) => r.action.target === questionId)
  return targetRule?.id ?? null
}

function CanvasInner({ projection }: { projection: FlowProjection | null }) {
  const { setCenter } = useReactFlow()
  const { resolvedTheme } = useTheme()
  const showJump = useBuilderStore((s) => s.flowShowJumpEdges)
  const showVisibility = useBuilderStore((s) => s.flowShowVisibilityEdges)
  const searchQuery = useBuilderStore((s) => s.flowCanvasSearchQuery)
  const editingRuleId = useBuilderStore((s) => s.editingRuleId)
  const { openRule, clearRuleFocus } = useRuleAuthoring()

  const initialFitDone = useRef(false)

  const layoutSig = projection?.topologyKey ?? ''
  const questionTitles = projection?.questionTitles ?? EMPTY_QUESTION_TITLES

  const { baseNodes, edges, layoutMeta } = useMemo(() => {
    if (!projection) {
      return {
        baseNodes: [] as Node[],
        edges: [] as Edge[],
        layoutMeta: { columns: 1, compact: false },
      }
    }

    const { graph, layout, issueSeverityByTarget } = projection
    const { positions, columns, compact } = layout

    const nodeRects = new Map<
      string,
      { x: number; y: number; w: number; h: number }
    >()
    const rfNodes: Node[] = graph.nodes.map((n: any) => {
      const pos = positions.get(n.id) ?? { x: 0, y: 0 }
      const elIssue = n.elementId
        ? issueSeverityByTarget.get(n.elementId)
        : undefined
      const { w, h } = flowNodeDimensions(n, compact)
      nodeRects.set(n.id, { x: pos.x, y: pos.y, w, h })
      const data: NodeData = {
        ...n,
        compact,
        hasError: elIssue === 'error',
        hasWarn: elIssue === 'warn',
      }
      return {
        id: n.id,
        type: 'graphNode',
        position: pos,
        width: w,
        height: h,
        data: data as unknown as Record<string, unknown>,
        draggable: false,
      }
    })

    const labelSlots = new Map<string, { x: number; y: number }>()
    const ruleEdges = graph.edges.filter((e: any) => e.kind !== 'default')
    const grouped = new Map<string, typeof ruleEdges>()
    for (const edge of ruleEdges) {
      const list = grouped.get(edge.source) ?? []
      list.push(edge)
      grouped.set(edge.source, list)
    }

    for (const edgesForSource of grouped.values()) {
      const sorted = [...edgesForSource].sort((a, b) => {
        const aTarget = nodeRects.get(a.target)
        const bTarget = nodeRects.get(b.target)
        if (!aTarget || !bTarget) return 0
        const ay = aTarget.y + aTarget.h / 2
        const by = bTarget.y + bTarget.h / 2
        if (ay !== by) return ay - by
        const ax = aTarget.x + aTarget.w / 2
        const bx = bTarget.x + bTarget.w / 2
        return ax - bx
      })

      sorted.forEach((edge, index) => {
        const source = nodeRects.get(edge.source)
        const target = nodeRects.get(edge.target)
        if (!source || !target) return
        const sx = source.x + source.w / 2
        const sy = source.y + source.h / 2
        const tx = target.x + target.w / 2
        const ty = target.y + target.h / 2
        const dx = tx - sx
        const dy = ty - sy
        const vertical = Math.abs(dy) >= Math.abs(dx)
        const direction = index % 2 === 0 ? 1 : -1
        const distance = 14 + Math.floor(index / 2) * 12
        labelSlots.set(edge.id, {
          x: vertical ? direction * distance : 0,
          y: vertical ? 0 : direction * distance,
        })
      })
    }

    const rfEdges: Edge[] = graph.edges
      .filter((e: any) => {
        if (e.kind === 'visibility') return showVisibility
        if (e.kind === 'jump' || e.kind === 'end') return showJump
        return true
      })
      .map((e: any) => {
        const handles = edgeHandles(e.kind)
        const labelOffset = labelSlots.get(e.id)
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          ...handles,
          label: undefined,
          type: 'flowRule',
          animated: e.kind === 'jump' || e.kind === 'end',
          style: edgeStyle(e.kind, false),
          interactionWidth: e.kind === 'default' ? 12 : 24,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: markerColor(e.kind),
          },
          data: {
            ruleId: e.ruleId,
            kind: e.kind,
            label: e.kind === 'default' ? undefined : e.label,
            labelOffsetX: labelOffset?.x,
            labelOffsetY: labelOffset?.y,
          },
        }
      })

    return {
      baseNodes: rfNodes,
      edges: rfEdges,
      layoutMeta: { columns, compact },
    }
  }, [projection, showJump, showVisibility])

  const hasSearch = searchQuery.trim().length > 0
  const selectedRule = useMemo(
    () => projection?.rules.find((r) => r.id === editingRuleId),
    [projection?.rules, editingRuleId]
  )

  const nodes = useMemo(
    () =>
      baseNodes.map((n) => {
        const data = n.data as unknown as NodeData
        const matches = nodeMatchesSearch(
          data,
          searchQuery,
          questionTitles,
          projection?.rules ?? EMPTY_RULES
        )
        return {
          ...n,
          data: {
            ...data,
            selected:
              !!selectedRule &&
              !!data.elementId &&
              ruleTouchesQuestion(selectedRule, data.elementId),
            dimmed: hasSearch && !matches,
          } satisfies NodeData,
        }
      }),
    [
      baseNodes,
      searchQuery,
      questionTitles,
      projection?.rules,
      selectedRule,
      hasSearch,
    ]
  )

  const styledEdges = useMemo(
    () =>
      edges.map((e) => {
        const kind = e.data?.kind as FlowGraphEdge['kind'] | undefined
        const ruleId = e.data?.ruleId as string | undefined
        const selected = !!ruleId && ruleId === editingRuleId
        return {
          ...e,
          animated: selected || e.animated,
          style: edgeStyle(kind ?? 'default', selected),
        }
      }),
    [edges, editingRuleId]
  )

  /** 默认可读视口：固定缩放 + 锚定起点，避免大卷轴一进来就被缩到看不清 */
  const focusReadableView = useCallback(() => {
    if (!nodes.length) return

    const startNode = nodes.find((n) => n.id === START_ID)
    const firstQuestion = nodes.find(
      (n) => (n.data as unknown as NodeData).kind === 'question'
    )
    const anchor = startNode ?? firstQuestion ?? nodes[0]
    const width =
      typeof anchor.width === 'number'
        ? anchor.width
        : layoutMeta.compact
          ? 176
          : 220
    const zoom = layoutMeta.compact ? 1.12 : 0.95
    const offsetY = layoutMeta.compact ? 120 : 140

    setCenter(anchor.position.x + width / 2, anchor.position.y + offsetY, {
      zoom,
      duration: 0,
    })
  }, [nodes, setCenter, layoutMeta.compact])

  // 仅在首次进入 / 结构变化时定位可读视口，不干扰用户手动缩放
  useEffect(() => {
    if (!nodes.length) return
    initialFitDone.current = false
  }, [layoutSig, nodes.length])

  useEffect(() => {
    if (!nodes.length || initialFitDone.current) return
    const id = requestAnimationFrame(() => {
      focusReadableView()
      initialFitDone.current = true
    })
    return () => cancelAnimationFrame(id)
  }, [layoutSig, focusReadableView, nodes.length])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as unknown as NodeData
      if (data.elementId) {
        const ruleId = pickRuleForQuestion(
          projection?.rules ?? EMPTY_RULES,
          data.elementId
        )
        if (ruleId) openRule(ruleId)
        else clearRuleFocus()
      }
    },
    [projection?.rules, openRule, clearRuleFocus]
  )

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const ruleId = edge.data?.ruleId as string | undefined
      if (ruleId) openRule(ruleId)
    },
    [openRule]
  )

  if (!projection) return null

  const colorMode = resolvedTheme === 'dark' ? 'dark' : 'light'

  return (
    <ReactFlow
      nodes={nodes}
      edges={styledEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      colorMode={colorMode}
      className='survey-flow-canvas bg-transparent'
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      panOnDrag
      panOnScroll={false}
      zoomOnScroll
      zoomOnPinch
      zoomOnDoubleClick={false}
      minZoom={0.2}
      maxZoom={1.75}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={20} size={1} />
      <Controls showInteractive={false} position='bottom-left' />
      <MiniMap
        position='bottom-right'
        pannable
        zoomable
        nodeStrokeWidth={2}
        ariaLabel='流程图导航'
        style={{ width: 140, height: 96 }}
      />
      <FlowLegend />
    </ReactFlow>
  )
}

export function Canvas({ projection }: { projection: FlowProjection | null }) {
  return (
    <ReactFlowProvider>
      <CanvasInner projection={projection} />
    </ReactFlowProvider>
  )
}
