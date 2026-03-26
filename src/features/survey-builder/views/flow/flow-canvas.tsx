import { memo, useCallback } from 'react'
import dagre from '@dagrejs/dagre'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Position,
  getBezierPath,
  useReactFlow,
  useStore,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type EdgeProps,
  type OnNodeDrag,
  type ReactFlowState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Trash2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getQuestion } from '@/features/survey-builder/questions'
import {
  useUIStore,
  useFlowStore,
  useSchemaStore,
} from '@/features/survey-builder/state'
import {
  useQuestionNodes,
  useQuestionIndexMap,
} from '@/features/survey-builder/state/selectors'
import {
  type QuestionNode,
  FLOW_ACTION_CONFIG,
  FALLBACK_ACTION_CONFIG,
} from '@/features/survey-builder/types'

const NODE_W = 224
const NODE_H = 88

type QuestionNodeData = {
  node: QuestionNode
  num: number
  isStart: boolean
  isEnd: boolean
  isJumpTarget: boolean
}

type FlowEdgeData = {
  ruleId: string
  actionType: string
  ruleName: string
  edgeKind: 'forward' | 'backward' | 'skip'
}

type HandleBounds = {
  id: string | null
  position: Position
  x: number
  y: number
  width: number
  height: number
}

function getNodeCenter(node: Node) {
  const w = node.measured?.width ?? NODE_W
  const h = node.measured?.height ?? NODE_H
  return { x: node.position.x + w / 2, y: node.position.y + h / 2 }
}

function getHandleCoords(node: Node, bounds: HandleBounds[], pos: Position) {
  const h = bounds.find((b) => b.position === pos)
  if (!h) return null
  return {
    x: node.position.x + h.x + h.width / 2,
    y: node.position.y + h.y + h.height / 2,
  }
}

function getInternals(node: Node) {
  const n = node as any
  const sym = Object.getOwnPropertySymbols(n).find((s) =>
    s.toString().includes('internals')
  )
  return sym ? n[sym] : n['internals']
}

function getFloatingEdgeParams(sourceNode: Node, targetNode: Node) {
  const sc = getNodeCenter(sourceNode)
  const tc = getNodeCenter(targetNode)
  const sInt = getInternals(sourceNode)
  const tInt = getInternals(targetNode)
  const sHandles: HandleBounds[] = sInt?.handleBounds?.source ?? []
  const tHandles: HandleBounds[] = tInt?.handleBounds?.target ?? []

  const positions: Position[] = [
    Position.Top,
    Position.Bottom,
    Position.Left,
    Position.Right,
  ]

  let bestDist = Infinity
  let result = {
    sx: sc.x,
    sy: sc.y,
    tx: tc.x,
    ty: tc.y,
    sourcePos: Position.Bottom as Position,
    targetPos: Position.Top as Position,
  }

  for (const sp of positions) {
    const s = getHandleCoords(sourceNode, sHandles, sp)
    if (!s) continue
    for (const tp of positions) {
      const t = getHandleCoords(targetNode, tHandles, tp)
      if (!t) continue
      const dist = Math.hypot(s.x - t.x, s.y - t.y)
      if (dist < bestDist) {
        bestDist = dist
        result = {
          sx: s.x,
          sy: s.y,
          tx: t.x,
          ty: t.y,
          sourcePos: sp,
          targetPos: tp,
        }
      }
    }
  }
  return result
}

function deriveNodeRoles(
  nodes: Node[],
  edges: Edge[],
  idToNum: Record<string, number>
) {
  const inIds = new Set(edges.map((e) => e.target))
  const outIds = new Set(edges.map((e) => e.source))
  const jumpTargetIds = new Set<string>()

  edges.forEach((e) => {
    const sNum = idToNum[e.source] ?? 0
    const tNum = idToNum[e.target] ?? 0
    if (tNum < sNum) jumpTargetIds.add(e.target)
  })

  return nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      isStart: !inIds.has(n.id) && outIds.has(n.id),
      isEnd: inIds.has(n.id) && !outIds.has(n.id),
      isJumpTarget: jumpTargetIds.has(n.id),
    },
  }))
}

function deriveEdgeKinds(edges: Edge[], idToNum: Record<string, number>) {
  return edges.map((e) => {
    const sNum = idToNum[e.source] ?? 0
    const tNum = idToNum[e.target] ?? 0
    const diff = tNum - sNum
    const edgeKind: FlowEdgeData['edgeKind'] =
      diff < 0 ? 'backward' : diff > 1 ? 'skip' : 'forward'
    return { ...e, data: { ...(e.data ?? {}), edgeKind } }
  })
}

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  idToNum: Record<string, number>
) {
  const connectedIds = new Set<string>()
  edges.forEach((e) => {
    connectedIds.add(e.source)
    connectedIds.add(e.target)
  })

  const connectedNodes = nodes.filter((n) => connectedIds.has(n.id))
  const isolatedNodes = nodes.filter((n) => !connectedIds.has(n.id))

  let maxY = 0
  let layoutedConnected: Node[] = []

  if (connectedNodes.length > 0) {
    const g = new dagre.graphlib.Graph()
    g.setGraph({ rankdir: 'LR', nodesep: 48, ranksep: 100 })
    g.setDefaultEdgeLabel(() => ({}))

    connectedNodes.forEach((n) =>
      g.setNode(n.id, {
        width: n.measured?.width ?? NODE_W,
        height: n.measured?.height ?? NODE_H,
      })
    )

    // Real jump edges
    edges.forEach((e) => {
      if (connectedIds.has(e.source) && connectedIds.has(e.target)) {
        g.setEdge(e.source, e.target)
      }
    })

    // Ghost spine edges ordered by num to anchor rank positions
    const connectedSorted = connectedNodes
      .map((n) => ({ id: n.id, num: idToNum[n.id] ?? 0 }))
      .sort((a, b) => a.num - b.num)

    for (let i = 0; i < connectedSorted.length - 1; i++) {
      const a = connectedSorted[i].id
      const b = connectedSorted[i + 1].id
      if (!g.hasEdge(a, b) && !g.hasEdge(b, a)) {
        g.setEdge(a, b, { weight: 0.01 })
      }
    }

    dagre.layout(g)

    layoutedConnected = connectedNodes.map((n) => {
      const { x, y } = g.node(n.id)
      const w = n.measured?.width ?? NODE_W
      const h = n.measured?.height ?? NODE_H
      const pos = { x: x - w / 2, y: y - h / 2 }
      if (pos.y + h > maxY) maxY = pos.y + h
      return { ...n, position: pos }
    })
  }

  // Isolated: grid below, sorted by num
  const COLS = 3
  const GAP_X = 40
  const GAP_Y = 40
  const SECTION_GAP = connectedNodes.length > 0 ? 80 : 0
  const startY = maxY + SECTION_GAP

  const isolatedSorted = [...isolatedNodes].sort(
    (a, b) => (idToNum[a.id] ?? 0) - (idToNum[b.id] ?? 0)
  )

  const layoutedIsolated = isolatedSorted.map((n, i) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const w = n.measured?.width ?? NODE_W
    const h = n.measured?.height ?? NODE_H
    return {
      ...n,
      position: { x: col * (w + GAP_X), y: startY + row * (h + GAP_Y) },
    }
  })

  return { nodes: [...layoutedConnected, ...layoutedIsolated], edges }
}

// ─────────────────────────────────────────────
// Question Node
// ─────────────────────────────────────────────

const handleCls =
  '!bg-background !h-2.5 !w-2.5 !border-2 transition-all !border-border hover:!border-primary hover:!bg-primary/10 opacity-0 group-hover:opacity-100'

const QuestionNodeComponent = memo(function QuestionNode({
  data,
  selected,
}: NodeProps) {
  const { node, num, isStart, isEnd, isJumpTarget } = data as QuestionNodeData
  const meta = getQuestion(node.type)?.meta
  const Icon = meta?.icon
  const { selectNode } = useUIStore()

  return (
    <div
      className={cn(
        'group bg-background relative flex h-full w-full cursor-default flex-col justify-center select-none',
        'rounded-xl border shadow-sm transition-all duration-150',
        isStart && 'border-l-[3px] border-l-emerald-500!',
        isEnd && 'border-l-[3px] border-l-slate-400!',
        isJumpTarget &&
          !isStart &&
          !isEnd &&
          'border-l-[3px] border-l-amber-400!',
        selected
          ? 'border-foreground! ring-foreground/10 shadow-md ring-1'
          : 'border-border hover:border-foreground/30! hover:shadow-md'
      )}
      style={{ width: NODE_W, height: NODE_H }}
      onClick={() => selectNode(node.id)}
    >
      {/* Role pill */}
      {(isStart || isEnd) && (
        <span
          className={cn(
            'absolute -top-2 right-3 rounded-full px-1.5 py-px text-[9px] font-bold tracking-wide',
            isStart
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700'
              : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-600'
          )}
        >
          {isStart ? '起点' : '终点'}
        </span>
      )}

      <Handle
        type='target'
        position={Position.Top}
        className={handleCls}
        id='t-top'
      />
      <Handle
        type='target'
        position={Position.Bottom}
        className={handleCls}
        id='t-bottom'
      />
      <Handle
        type='target'
        position={Position.Left}
        className={handleCls}
        id='t-left'
      />
      <Handle
        type='target'
        position={Position.Right}
        className={handleCls}
        id='t-right'
      />
      <Handle
        type='source'
        position={Position.Top}
        className={handleCls}
        id='s-top'
      />
      <Handle
        type='source'
        position={Position.Bottom}
        className={handleCls}
        id='s-bottom'
      />
      <Handle
        type='source'
        position={Position.Left}
        className={handleCls}
        id='s-left'
      />
      <Handle
        type='source'
        position={Position.Right}
        className={handleCls}
        id='s-right'
      />

      <div className='px-3 py-2.5'>
        <div className='mb-1.5 flex items-center gap-1.5'>
          <Badge
            variant='secondary'
            className='h-4 rounded px-1.5 font-mono text-[10px] font-bold'
          >
            {String(num).padStart(2, '0')}
          </Badge>
          {Icon && <Icon className='text-muted-foreground h-3 w-3 shrink-0' />}
          <span className='text-muted-foreground min-w-0 flex-1 truncate text-[10px]'>
            {meta?.label}
          </span>
          {node.required && (
            <span className='text-destructive text-[9px] font-bold'>必填</span>
          )}
        </div>
        <p className='text-foreground line-clamp-2 text-xs leading-snug font-medium'>
          {node.title || '（未命名）'}
        </p>
      </div>
    </div>
  )
})

// ─────────────────────────────────────────────
// Edge visual styles
// ─────────────────────────────────────────────

const EDGE_KIND_STYLE = {
  forward: {
    stroke: 'hsl(215 75% 52%)',
    dash: undefined,
    opacity: 0.9,
    width: 1.5,
    arrow: 'hsl(215 75% 52%)',
  },
  skip: {
    stroke: 'hsl(258 60% 58%)',
    dash: '6 3',
    opacity: 0.75,
    width: 1.5,
    arrow: 'hsl(258 60% 58%)',
  },
  backward: {
    stroke: 'hsl(36 88% 48%)',
    dash: '4 4',
    opacity: 0.8,
    width: 1.5,
    arrow: 'hsl(36 88% 48%)',
  },
} as const

// ─────────────────────────────────────────────
// Floating Edge
// ─────────────────────────────────────────────

function FloatingEdgeComponent({
  id,
  source,
  target,
  data,
  selected,
}: EdgeProps) {
  const { removeRule } = useFlowStore()
  const { setActiveRule } = useUIStore()
  const {
    ruleId,
    actionType,
    ruleName,
    edgeKind = 'forward',
  } = (data ?? {}) as FlowEdgeData

  const actionMeta = FLOW_ACTION_CONFIG[actionType] ?? FALLBACK_ACTION_CONFIG
  const ks = EDGE_KIND_STYLE[edgeKind]

  const sourceNode = useStore(
    useCallback((s: ReactFlowState) => s.nodeLookup.get(source), [source])
  )
  const targetNode = useStore(
    useCallback((s: ReactFlowState) => s.nodeLookup.get(target), [target])
  )

  if (!sourceNode || !targetNode) return null

  const { sx, sy, tx, ty, sourcePos, targetPos } = getFloatingEdgeParams(
    sourceNode,
    targetNode
  )

  const curvature = edgeKind === 'backward' ? 0.65 : 0.4
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
    curvature,
  })

  // Dynamic arrowhead matching edge color
  const markerId = `arrow-${edgeKind}`

  return (
    <>
      {/* Inline SVG defs for colored arrowheads */}
      <defs>
        <marker
          id={markerId}
          viewBox='0 0 10 10'
          refX='8'
          refY='5'
          markerWidth='10'
          markerHeight='10'
          orient='auto-start-reverse'
        >
          <path
            d='M 1 1 L 8 5 L 1 9'
            fill='none'
            stroke={ks.arrow}
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </marker>
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        style={{
          stroke: ks.stroke,
          strokeWidth: selected ? ks.width + 1 : ks.width,
          strokeDasharray: selected ? undefined : ks.dash,
          opacity: selected ? 1 : ks.opacity,
          transition: 'stroke-width 0.15s, opacity 0.15s',
        }}
      />

      <EdgeLabelRenderer>
        <div
          className='nodrag nopan pointer-events-auto absolute'
          style={{
            transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          {selected ? (
            <div
              className='bg-background flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold shadow-md'
              style={{ borderColor: ks.stroke, color: ks.stroke }}
              onClick={(e) => {
                e.stopPropagation()
                setActiveRule(null)
              }}
              title={ruleName}
            >
              <span>{actionMeta.label}</span>
              <button
                className='ml-0.5 opacity-60 transition-opacity hover:opacity-100'
                title='删除规则'
                onClick={(e) => {
                  e.stopPropagation()
                  removeRule(ruleId)
                }}
              >
                <Trash2 className='h-2.5 w-2.5' />
              </button>
            </div>
          ) : (
            <div
              className='bg-background flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-2 shadow-sm transition-transform hover:scale-125'
              style={{ borderColor: ks.stroke }}
              onClick={(e) => {
                e.stopPropagation()
                setActiveRule(ruleId)
              }}
              title={`${actionMeta.label}：${ruleName}`}
            >
              <div
                className='h-1.5 w-1.5 rounded-full'
                style={{ background: ks.stroke }}
              />
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

// ─────────────────────────────────────────────
// Legend
// ─────────────────────────────────────────────

function FlowLegend() {
  return (
    <div className='border-border bg-background/90 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border px-3 py-2 shadow-sm backdrop-blur-sm'>
      <div className='flex items-center gap-1.5'>
        <div className='h-3.5 w-1 rounded-full bg-emerald-500' />
        <span className='text-muted-foreground text-[10px]'>起点</span>
      </div>
      <div className='flex items-center gap-1.5'>
        <div className='h-3.5 w-1 rounded-full bg-slate-400' />
        <span className='text-muted-foreground text-[10px]'>终点</span>
      </div>
      <div className='flex items-center gap-1.5'>
        <div className='h-3.5 w-1 rounded-full bg-amber-400' />
        <span className='text-muted-foreground text-[10px]'>被跳回</span>
      </div>
      <div className='bg-border h-3 w-px' />
      {(
        [
          { label: '顺序', stroke: 'hsl(215 75% 52%)', dash: undefined },
          { label: '跳题', stroke: 'hsl(258 60% 58%)', dash: '5 3' },
          { label: '跳回', stroke: 'hsl(36 88% 48%)', dash: '4 4' },
        ] as const
      ).map(({ label, stroke, dash }) => (
        <div key={label} className='flex items-center gap-1.5'>
          <svg width='22' height='8'>
            <line
              x1='0'
              y1='4'
              x2='22'
              y2='4'
              stroke={stroke}
              strokeWidth='1.5'
              strokeDasharray={dash}
            />
          </svg>
          <span className='text-muted-foreground text-[10px]'>{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Connection validation
// ─────────────────────────────────────────────

function useIsValidConnection() {
  const edges = useFlowStore(useShallow((s) => s.edges))
  return useCallback(
    (connection: Edge | Connection) => {
      if (connection.source === connection.target) return false
      return !edges.some(
        (e) => e.source === connection.source && e.target === connection.target
      )
    },
    [edges]
  )
}

const nodeTypes = { questionNode: QuestionNodeComponent }
const edgeTypes = { flowEdge: FloatingEdgeComponent }

// ─────────────────────────────────────────────
// Flow View
// ─────────────────────────────────────────────

function FlowView() {
  const rawNodes = useFlowStore(useShallow((s) => s.nodes))
  const rawEdges = useFlowStore(useShallow((s) => s.edges))
  const onNodesChange = useFlowStore((s) => s.onNodesChange)
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange)
  const setNodes = useFlowStore((s) => s.setNodes)
  const addRule = useFlowStore((s) => s.addRule)
  const { updateExtensions } = useSchemaStore()
  const visibleNodes = useQuestionNodes()
  const indexMap = useQuestionIndexMap()
  const { fitView } = useReactFlow()
  const isValidConnection = useIsValidConnection()

  const nodes = deriveNodeRoles(rawNodes, rawEdges, indexMap)
  const edges = deriveEdgeKinds(rawEdges, indexMap)

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_evt, _node, allNodes) => {
      const posMap: Record<string, { x: number; y: number }> = {}
      allNodes.forEach((n: Node) => {
        posMap[n.id] = n.position
      })
      updateExtensions({ flowPositions: posMap })
    },
    [updateExtensions]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      const from = visibleNodes.find((n) => n.id === connection.source)
      const to = visibleNodes.find((n) => n.id === connection.target)
      if (!from || !to) return

      addRule({
        name: `${from.title.slice(0, 10) || '题目'} → ${to.title.slice(0, 10) || '题目'}`,
        enabled: true,
        priority: 0,
        expression: {
          id: crypto.randomUUID(),
          type: 'group',
          op: 'and',
          children: [
            {
              id: crypto.randomUUID(),
              type: 'comparison',
              field: connection.source!,
              operator: 'is_not_empty',
              value: '',
            },
          ],
        },
        actions: [
          {
            id: crypto.randomUUID(),
            type: 'jump_question',
            target: connection.target!,
          },
        ],
      })
    },
    [visibleNodes, addRule]
  )

  const onAutoLayout = useCallback(() => {
    const { nodes: ln } = getLayoutedElements(rawNodes, rawEdges, indexMap)
    const posMap: Record<string, { x: number; y: number }> = {}
    ln.forEach((n: Node) => {
      posMap[n.id] = n.position
    })
    updateExtensions({ flowPositions: posMap })
    setNodes(() => ln)
    requestAnimationFrame(() => fitView({ padding: 0.18, duration: 450 }))
  }, [rawNodes, rawEdges, indexMap, setNodes, fitView, updateExtensions])

  if (visibleNodes.length === 0) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-center'>
          <p className='text-muted-foreground text-sm font-medium'>
            还没有题目
          </p>
          <p className='text-muted-foreground/60 mt-1 text-xs'>
            请先在「构建」模式下添加题目
          </p>
        </div>
      </div>
    )
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeDragStop={onNodeDragStop}
      isValidConnection={isValidConnection}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.18 }}
      minZoom={0.15}
      maxZoom={2}
      deleteKeyCode={null}
      connectionMode={'loose' as any}
      proOptions={{ hideAttribution: true }}
      style={
        {
          '--xy-background-color-default': 'transparent',
          '--xy-controls-button-background-color-default': 'var(--background)',
          '--xy-controls-button-background-color-hover-default': 'var(--muted)',
          '--xy-controls-button-border-color-default': 'var(--border)',
          '--xy-handle-background-color-default': 'var(--background)',
          '--xy-handle-border-color-default': 'var(--border)',
          '--xy-selection-background-color-default':
            'color-mix(in oklch, var(--primary) 8%, transparent)',
          '--xy-selection-border-default': '1px solid var(--primary)',
        } as React.CSSProperties
      }
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        className='text-border!'
      />
      <Controls showInteractive={false} />

      <Panel position='top-right'>
        <div className='border-border bg-background flex items-center gap-1 rounded-xl border p-1 shadow-sm'>
          <Button
            variant='ghost'
            size='sm'
            className='text-muted-foreground hover:text-foreground h-7 px-2.5 text-[11px]'
            onClick={onAutoLayout}
          >
            自动排列
          </Button>
        </div>
      </Panel>

      <Panel position='bottom-left'>
        <FlowLegend />
      </Panel>

      <Panel position='bottom-center'>
        <p className='text-muted-foreground/40 px-3 py-1 text-[10px]'>
          悬停节点显示连接点 · 拖拽连线 · 点圆点展开规则 · 展开后点 🗑 删除
        </p>
      </Panel>
    </ReactFlow>
  )
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <div className='h-full w-full'>
        <FlowView />
      </div>
    </ReactFlowProvider>
  )
}
