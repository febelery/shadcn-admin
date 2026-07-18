import { useMemo, useCallback, useEffect, useRef } from 'react'
import {
  BaseEdge,
  ReactFlow,
  Background,
  Controls,
  EdgeLabelRenderer,
  MiniMap,
  ReactFlowProvider,
  getSmoothStepPath,
  useNodesInitialized,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { START_ID } from '../../core/logic/flow-graph'
import { ruleMatchesSearch } from '../../core/logic/rule-meta'
import type { Rule } from '../../core/types'
import { useBuilderStore } from '../builder-session'
import { useRuleAuthoring } from '../session/rule-authoring'
import {
  createFlowCanvasProjection,
  FLOW_END_EDGE_COLOR,
  getFlowEdgeStyle,
  type FlowCanvasEdge,
} from './canvas-projection'
import './canvas.css'
import { GraphNode, type FlowCanvasNode, type NodeData } from './nodes'
import type { FlowProjection } from './projection'

const EMPTY_RULES: FlowProjection['rules'] = []
const EMPTY_QUESTION_TITLES: FlowProjection['questionTitles'] = new Map()

const nodeTypes = {
  graphNode: GraphNode,
}

const edgeTypes = {
  flowRule: FlowRuleEdge,
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
}: EdgeProps<FlowCanvasEdge>) {
  const edgeData = data
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
      color: FLOW_END_EDGE_COLOR,
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
  const { setCenter } = useReactFlow<FlowCanvasNode, FlowCanvasEdge>()
  const { resolvedTheme } = useTheme()
  const showJump = useBuilderStore((s) => s.flowShowJumpEdges)
  const showVisibility = useBuilderStore((s) => s.flowShowVisibilityEdges)
  const searchQuery = useBuilderStore((s) => s.flowCanvasSearchQuery)
  const editingRuleId = useBuilderStore((s) => s.editingRuleId)
  const { openRule, clearRuleFocus } = useRuleAuthoring()

  const nodesInitialized = useNodesInitialized()
  const focusedTopology = useRef<string | null>(null)

  const layoutSig = projection?.topologyKey ?? ''
  const questionTitles = projection?.questionTitles ?? EMPTY_QUESTION_TITLES

  const { baseNodes, edges, layoutMeta } = useMemo(
    () =>
      createFlowCanvasProjection(projection, {
        showJump,
        showVisibility,
      }),
    [projection, showJump, showVisibility]
  )

  const hasSearch = searchQuery.trim().length > 0
  const selectedRule = useMemo(
    () => projection?.rules.find((r) => r.id === editingRuleId),
    [projection?.rules, editingRuleId]
  )

  const nodes = useMemo(
    () =>
      baseNodes.map((n) => {
        const data = n.data
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
        const kind = e.data?.kind
        const ruleId = e.data?.ruleId
        const selected = !!ruleId && ruleId === editingRuleId
        return {
          ...e,
          animated: selected || e.animated,
          style: getFlowEdgeStyle(kind ?? 'default', selected),
        }
      }),
    [edges, editingRuleId]
  )

  /** 默认可读视口：固定缩放 + 锚定起点，避免大卷轴一进来就被缩到看不清 */
  const focusReadableView = useCallback(() => {
    if (!nodes.length) return

    const startNode = nodes.find((n) => n.id === START_ID)
    const firstQuestion = nodes.find((n) => n.data.kind === 'question')
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

  // 仅在 XYFlow 完成节点初始化后按拓扑定位一次，不干扰用户手动缩放。
  useEffect(() => {
    if (
      !nodesInitialized ||
      !nodes.length ||
      focusedTopology.current === layoutSig
    ) {
      return
    }
    focusReadableView()
    focusedTopology.current = layoutSig
  }, [nodesInitialized, nodes.length, layoutSig, focusReadableView])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: FlowCanvasNode) => {
      const data = node.data
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
    (_: React.MouseEvent, edge: FlowCanvasEdge) => {
      const ruleId = edge.data?.ruleId
      if (ruleId) openRule(ruleId)
    },
    [openRule]
  )

  if (!projection) return null

  const colorMode = resolvedTheme === 'dark' ? 'dark' : 'light'

  return (
    <ReactFlow<FlowCanvasNode, FlowCanvasEdge>
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
