import { useMemo, useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTheme } from '@/context/theme-provider'
import { useBuilderStore } from '../store'
import type { SurveySchema, FlowGraphEdge } from '../types'
import './canvas.css'
import { useFlowContext } from './context'
import { nodeTypes, type NodeData } from './nodes'

/** 边样式 — 使用 React Flow CSS 变量，避免 inline SVG 颜色无效 */
function edgeStyle(
  kind: FlowGraphEdge['kind'],
  selected: boolean
): React.CSSProperties {
  switch (kind) {
    case 'jump':
      return {
        stroke: 'var(--primary)',
        strokeWidth: selected ? 3 : 2,
      }
    case 'end':
      return {
        stroke: 'var(--destructive)',
        strokeWidth: selected ? 3 : 2,
      }
    case 'visibility':
      return {
        stroke: 'var(--muted-foreground)',
        strokeWidth: selected ? 2 : 1,
        strokeDasharray: '6 4',
        opacity: selected ? 1 : 0.6,
      }
    default:
      return {
        stroke: 'var(--border)',
        strokeWidth: 1.5,
      }
  }
}

function markerColor(kind: FlowGraphEdge['kind']): string {
  if (kind === 'end') return 'var(--destructive)'
  if (kind === 'jump') return 'var(--primary)'
  return 'var(--muted-foreground)'
}

function buildLayoutSignature(
  schema: SurveySchema,
  showJump: boolean,
  showVisibility: boolean
) {
  const section = schema.sections[0]
  return JSON.stringify({
    showJump,
    showVisibility,
    elements: section?.elements.map((e) => e.id),
    rules: schema.rules.map((r) => ({
      id: r.id,
      enabled: r.enabled,
      when: r.when,
      actions: r.actions,
    })),
    titles: section?.elements
      .filter((e) => e.kind === 'question')
      .map((e) => (e.kind === 'question' ? e.title : '')),
  })
}

function nodeMatchesSearch(
  data: NodeData,
  query: string,
  questionTitles: Map<string, string>,
  rules: SurveySchema['rules'],
  ruleMatchesSearchFn: (
    rule: any,
    query: string,
    questionTitles: Map<string, string>
  ) => boolean
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
        ruleMatchesSearchFn(r, query, questionTitles) &&
        (r.when.includes(data.elementId!) ||
          r.actions.some((a) => a.target === data.elementId))
    )
    if (related) return true
  }
  return false
}

type InnerProps = {
  /** 注册「适应画布」全览回调 */
  onRegisterFitView?: (fn: () => void) => void
}

function CanvasInner({ onRegisterFitView }: InnerProps) {
  const { fitView, setCenter } = useReactFlow()
  const { resolvedTheme } = useTheme()
  const schema = useBuilderStore((s) => s.schema)
  const showJump = useBuilderStore((s) => s.flowShowJumpEdges)
  const showVisibility = useBuilderStore((s) => s.flowShowVisibilityEdges)
  const searchQuery = useBuilderStore((s) => s.flowCanvasSearchQuery)
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)
  const editingRuleId = useBuilderStore((s) => s.editingRuleId)
  const selectFlowQuestion = useBuilderStore((s) => s.selectFlowQuestion)
  const selectFlowRule = useBuilderStore((s) => s.selectFlowRule)

  const {
    analyseSurvey,
    buildFlowGraph,
    flowNodeDimensions,
    layoutFlowGraphWithMeta,
    START_ID,
    ruleMatchesSearch: ruleMatchesSearchFn,
    flattenQuestions,
    getQuestionReferenceLabel,
  } = useFlowContext()

  const layoutCache = useRef<{
    sig: string
    nodes: Node[]
    edges: Edge[]
    columns: number
    compact: boolean
  } | null>(null)

  const initialFitDone = useRef(false)

  const layoutSig = useMemo(
    () =>
      schema ? buildLayoutSignature(schema, showJump, showVisibility) : '',
    [schema, showJump, showVisibility]
  )

  const questionTitles = useMemo(() => {
    const map = new Map<string, string>()
    if (!schema) return map
    flattenQuestions(schema).forEach((q) => {
      map.set(q.id, getQuestionReferenceLabel(q, schema))
    })
    return map
  }, [schema, flattenQuestions, getQuestionReferenceLabel])

  const { baseNodes, edges, layoutMeta } = useMemo(() => {
    if (!schema) {
      return {
        baseNodes: [] as Node[],
        edges: [] as Edge[],
        layoutMeta: { columns: 1, compact: false },
      }
    }

    if (layoutCache.current?.sig === layoutSig) {
      return {
        baseNodes: layoutCache.current.nodes,
        edges: layoutCache.current.edges,
        layoutMeta: {
          columns: layoutCache.current.columns,
          compact: layoutCache.current.compact,
        },
      }
    }

    const graph = buildFlowGraph(schema)
    const { positions, columns, compact } = layoutFlowGraphWithMeta(graph)
    const issuesMap = new Map<string, 'error' | 'warn'>()
    for (const i of analyseSurvey(schema)) {
      if (!i.targetId) continue
      if (i.severity === 'error') issuesMap.set(i.targetId, 'error')
      else if (!issuesMap.has(i.targetId)) issuesMap.set(i.targetId, 'warn')
    }

    const rfNodes: Node[] = graph.nodes.map((n: any) => {
      const pos = positions.get(n.id) ?? { x: 0, y: 0 }
      const elIssue = n.elementId ? issuesMap.get(n.elementId) : undefined
      const { w, h } = flowNodeDimensions(n, compact)
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

    const rfEdges: Edge[] = graph.edges
      .filter((e: any) => {
        if (e.kind === 'visibility') return showVisibility
        if (e.kind === 'jump' || e.kind === 'end') return showJump
        return true
      })
      .map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.kind === 'default' ? undefined : e.label,
        type: 'smoothstep',
        animated: e.kind === 'jump' || e.kind === 'end',
        style: edgeStyle(e.kind, false),
        interactionWidth: 20,
        labelShowBg: e.kind !== 'default',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: markerColor(e.kind),
        },
        data: { ruleId: e.ruleId, kind: e.kind },
      }))

    layoutCache.current = {
      sig: layoutSig,
      nodes: rfNodes,
      edges: rfEdges,
      columns,
      compact,
    }
    return {
      baseNodes: rfNodes,
      edges: rfEdges,
      layoutMeta: { columns, compact },
    }
  }, [
    schema,
    showJump,
    showVisibility,
    layoutSig,
    buildFlowGraph,
    layoutFlowGraphWithMeta,
    analyseSurvey,
    flowNodeDimensions,
  ])

  const hasSearch = searchQuery.trim().length > 0

  const nodes = useMemo(
    () =>
      baseNodes.map((n) => {
        const data = n.data as unknown as NodeData
        const matches = nodeMatchesSearch(
          data,
          searchQuery,
          questionTitles,
          schema?.rules ?? [],
          ruleMatchesSearchFn
        )
        return {
          ...n,
          data: {
            ...data,
            selected: data.elementId === selectedElementId,
            dimmed: hasSearch && !matches,
          } satisfies NodeData,
        }
      }),
    [
      baseNodes,
      selectedElementId,
      searchQuery,
      questionTitles,
      schema?.rules,
      hasSearch,
      ruleMatchesSearchFn,
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
    const zoom = layoutMeta.compact ? 1 : 0.95
    const offsetY = layoutMeta.compact ? 180 : 160

    setCenter(anchor.position.x + 130, anchor.position.y + offsetY, {
      zoom,
      duration: 280,
    })
  }, [nodes, setCenter, layoutMeta.compact])

  /** 工具栏「适应画布」：缩放到能看全图 */
  const fitOverview = useCallback(() => {
    if (!nodes.length) return
    fitView({
      padding: 0.12,
      maxZoom: layoutMeta.compact ? 0.95 : 1,
      minZoom: 0.25,
      duration: 320,
    })
  }, [nodes, fitView, layoutMeta.compact])

  useEffect(() => {
    onRegisterFitView?.(fitOverview)
  }, [onRegisterFitView, fitOverview])

  // 仅在首次进入 / 结构变化时定位可读视口，不干扰用户手动缩放
  useEffect(() => {
    if (!nodes.length) return
    initialFitDone.current = false
  }, [layoutSig])

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
        selectFlowQuestion(data.elementId)
      }
    },
    [selectFlowQuestion]
  )

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const ruleId = edge.data?.ruleId as string | undefined
      if (ruleId) selectFlowRule(ruleId)
    },
    [selectFlowRule]
  )

  if (!schema) return null

  const colorMode = resolvedTheme === 'dark' ? 'dark' : 'light'

  return (
    <ReactFlow
      nodes={nodes}
      edges={styledEdges}
      nodeTypes={nodeTypes}
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
    </ReactFlow>
  )
}

type Props = {
  onRegisterFitView?: (fn: () => void) => void
}

export function Canvas({ onRegisterFitView }: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner onRegisterFitView={onRegisterFitView} />
    </ReactFlowProvider>
  )
}
