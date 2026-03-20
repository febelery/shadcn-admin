import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
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
  MarkerType,
  getBezierPath,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type EdgeProps,
  type OnNodeDrag,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { QUESTION_TYPE_MAP } from '@/features/survey-builder/constants'
import {
  useBuilderStore,
  useVisibleNodeNumber,
} from '@/features/survey-builder/store'
import type {
  QuestionNode,
  NodeType,
  LogicRule,
} from '@/features/survey-builder/types'

// ─── Constants ────────────────────────────────────────────
const NODE_W = 220
const NODE_H = 84
const POS_KEY = 'survey-builder:logic-positions'

// ─── Action metadata (CSS vars, no hardcoded colors) ─────
const ACTION_META: Record<string, { label: string; color: string }> = {
  jump_question: { label: '跳转', color: 'var(--color-primary)' },
  show: { label: '显示', color: 'var(--color-chart-2)' },
  hide: { label: '隐藏', color: 'var(--color-muted-foreground)' },
  end: { label: '结束', color: 'var(--color-destructive)' },
  set_required: { label: '必填', color: 'var(--color-chart-4)' },
  set_readonly: { label: '只读', color: 'var(--color-chart-3)' },
  set_value: { label: '赋值', color: 'var(--color-chart-1)' },
  clear_value: { label: '清空', color: 'var(--color-muted-foreground)' },
  show_option: { label: '显示选项', color: 'var(--color-chart-2)' },
  hide_option: { label: '隐藏选项', color: 'var(--color-muted-foreground)' },
}
const FALLBACK_META = { label: '规则', color: 'var(--color-muted-foreground)' }

// ─── Types ────────────────────────────────────────────────
type QuestionNodeData = { node: QuestionNode; num: number }
type LogicEdgeData = { ruleId: string; actionType: string; ruleName: string }

// ─── Dagre auto-layout ────────────────────────────────────
function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 })
  g.setDefaultEdgeLabel(() => ({}))

  nodes.forEach((n) =>
    g.setNode(n.id, {
      // v12: measured 存储实际尺寸，fallback 到静态常量
      width: n.measured?.width ?? NODE_W,
      height: n.measured?.height ?? NODE_H,
    })
  )
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)

  return {
    nodes: nodes.map((n) => {
      const { x, y } = g.node(n.id)
      return {
        ...n,
        position: {
          x: x - (n.measured?.width ?? NODE_W) / 2,
          y: y - (n.measured?.height ?? NODE_H) / 2,
        },
      }
    }),
    edges,
  }
}

// ─── Position persistence ─────────────────────────────────
function loadPositions(): Record<string, { x: number; y: number }> {
  try {
    return JSON.parse(sessionStorage.getItem(POS_KEY) ?? '{}')
  } catch {
    return {}
  }
}
function savePositions(nodes: Node[]) {
  const map: Record<string, { x: number; y: number }> = {}
  nodes.forEach((n) => {
    map[n.id] = n.position
  })
  sessionStorage.setItem(POS_KEY, JSON.stringify(map))
}

// ─── Schema + logic → RF nodes & edges ───────────────────
function buildGraph(
  visibleNodes: QuestionNode[],
  logic: LogicRule[],
  numMap: Record<string, number>,
  positions: Record<string, { x: number; y: number }>
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = visibleNodes.map((node, i) => ({
    id: node.id,
    type: 'questionNode',
    position: positions[node.id] ?? { x: 120, y: i * (NODE_H + 56) },
    data: { node, num: numMap[node.id] } satisfies QuestionNodeData,
    width: NODE_W,
    height: NODE_H,
  }))

  const edges: Edge[] = []
  logic.forEach((rule) => {
    if (!rule.enabled) return
    const fromId = (rule.condition.rules[0] as any)?.field as string | undefined
    rule.actions.forEach((action) => {
      const toId = action.target
      if (!fromId || !toId || fromId === toId) return
      edges.push({
        id: `${rule.id}::${action.type}::${toId}`,
        source: fromId,
        target: toId,
        type: 'logicEdge',
        data: {
          ruleId: rule.id,
          actionType: action.type,
          ruleName: rule.name,
        } satisfies LogicEdgeData,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          // color は edge の stroke と同期（EdgeComponent 側で上書き）
        },
      })
    })
  })

  return { nodes, edges }
}

// ─── Custom Node ──────────────────────────────────────────
// memo で不要な再描画を防ぐ
const QuestionNodeComponent = memo(function QuestionNode({
  data,
  selected,
}: NodeProps) {
  const { node, num } = data as QuestionNodeData
  const config = QUESTION_TYPE_MAP[node.type as NodeType]
  const Icon = config?.icon
  const { selectNode } = useBuilderStore()

  return (
    <div
      className={cn(
        'bg-background flex h-full w-full cursor-default flex-col justify-center select-none',
        'rounded-xl border shadow-sm transition-all duration-100',
        selected
          ? 'border-foreground ring-foreground/10 shadow-md ring-1'
          : 'border-border hover:border-foreground/40 hover:shadow-md'
      )}
      style={{ width: NODE_W, height: NODE_H }}
      onClick={() => selectNode(node.id)}
    >
      {/* Target handle — left */}
      <Handle
        type='target'
        position={Position.Left}
        className={cn(
          'bg-background! h-3! w-3! border-2! transition-colors',
          'border-border! hover:border-primary! hover:bg-primary/10!'
        )}
      />

      <div className='px-3 py-2.5'>
        {/* Meta row */}
        <div className='mb-1.5 flex items-center gap-1.5'>
          {num !== undefined && (
            <Badge
              variant='secondary'
              className='h-4 rounded px-1.5 font-mono text-[10px] font-bold'
            >
              {String(num).padStart(2, '0')}
            </Badge>
          )}
          {Icon && <Icon className='text-muted-foreground h-3 w-3 shrink-0' />}
          <span className='text-muted-foreground min-w-0 flex-1 truncate text-[10px]'>
            {config?.label}
          </span>
          {node.required && (
            <span className='text-destructive text-[9px] font-bold'>必填</span>
          )}
        </div>

        {/* Title */}
        <p className='text-foreground line-clamp-2 text-xs leading-snug font-medium'>
          {node.title || '（未命名）'}
        </p>
      </div>

      {/* Source handle — right */}
      <Handle
        type='source'
        position={Position.Right}
        className={cn(
          'bg-background! h-3! w-3! border-2! transition-colors',
          'border-border! hover:border-primary! hover:bg-primary/10!'
        )}
      />
    </div>
  )
})

// ─── Custom Edge ──────────────────────────────────────────
function LogicEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps) {
  const { removeRule, setActiveRule } = useBuilderStore()
  const { ruleId, actionType, ruleName } = (data ?? {}) as LogicEdgeData
  const meta = ACTION_META[actionType] ?? FALLBACK_META

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: meta.color,
          strokeWidth: selected ? 2.5 : 1.5,
          strokeDasharray: selected ? undefined : '5 3',
          opacity: selected ? 1 : 0.65,
        }}
      />

      <EdgeLabelRenderer>
        <div
          className='nodrag nopan pointer-events-auto absolute'
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <div
            className={cn(
              'bg-background flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5',
              'text-[9px] font-semibold shadow-sm transition-shadow',
              selected ? 'shadow-md' : 'hover:shadow-md'
            )}
            style={{ borderColor: meta.color, color: meta.color }}
            onClick={(e) => {
              e.stopPropagation()
              setActiveRule(selected ? null : ruleId)
            }}
            title={ruleName}
          >
            <span>{meta.label}</span>
            {selected && (
              <button
                className='ml-0.5 opacity-50 transition-opacity hover:opacity-100'
                title='删除规则'
                onClick={(e) => {
                  e.stopPropagation()
                  removeRule(ruleId)
                }}
              >
                <Trash2 className='h-2.5 w-2.5' />
              </button>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

// ─── Node / edge type maps (定义在组件外，引用稳定) ────────
const nodeTypes = { questionNode: QuestionNodeComponent }
const edgeTypes = { logicEdge: LogicEdgeComponent }

// ─── Inner flow (inside ReactFlowProvider) ────────────────
function LogicFlow() {
  const { schema, logic, addRule } = useBuilderStore()
  const numMap = useVisibleNodeNumber()
  const { fitView } = useReactFlow()

  const visibleNodes = useMemo(
    () =>
      schema
        .filter(
          (n: QuestionNode) =>
            !['block', 'divider', 'rich_text'].includes(n.type)
        )
        .sort((a: QuestionNode, b: QuestionNode) => a.order - b.order),
    [schema]
  )

  // 用 ref 持久化节点位置，避免 useEffect 闭包陈旧
  const positionsRef =
    useRef<Record<string, { x: number; y: number }>>(loadPositions())

  // 初始图形
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildGraph(visibleNodes, logic, numMap, positionsRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // 仅 mount 时执行一次
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges)

  // ── 同步 store → RF（schema 或 logic 变化后更新） ─────
  useEffect(() => {
    const { nodes: next, edges: nextEdges } = buildGraph(
      visibleNodes,
      logic,
      numMap,
      positionsRef.current
    )
    setNodes(next)
    setEdges(nextEdges)
  }, [visibleNodes, logic, numMap, setNodes, setEdges])

  // ── 节点拖拽结束：持久化位置 ───────────────────────────
  const onNodeDragStop: OnNodeDrag = useCallback((_evt, _node, allNodes) => {
    allNodes.forEach((n) => {
      positionsRef.current[n.id] = n.position
    })
    savePositions(allNodes)
  }, [])

  // ── 连线：创建跳转规则 ─────────────────────────────────
  const onConnect = useCallback(
    (connection: Connection) => {
      const from = visibleNodes.find(
        (n: QuestionNode) => n.id === connection.source
      )
      const to = visibleNodes.find(
        (n: QuestionNode) => n.id === connection.target
      )
      if (!from || !to) return

      addRule({
        name: `${from.title.slice(0, 10) || '题目'} → ${to.title.slice(0, 10) || '题目'}`,
        enabled: true,
        priority: 0,
        condition: {
          operator: 'and',
          rules: [
            { field: connection.source!, operator: 'is_not_empty', value: '' },
          ],
        },
        actions: [{ type: 'jump_question', target: connection.target! }],
      })
      // RF 的 edge 会通过 store→useEffect 同步，无需手动 addEdge
    },
    [visibleNodes, addRule]
  )

  // ── Dagre 自动排列 ─────────────────────────────────────
  const onAutoLayout = useCallback(() => {
    const { nodes: ln } = getLayoutedElements(nodes, edges)
    ln.forEach((n) => {
      positionsRef.current[n.id] = n.position
    })
    savePositions(ln)
    setNodes(ln)
    // fitView 等节点位置更新完成后执行
    setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50)
  }, [nodes, edges, setNodes, fitView])

  // ── Empty state ────────────────────────────────────────
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
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.2}
      maxZoom={2}
      // 禁用 Delete 键删除（通过 UI 的删除按钮处理）
      deleteKeyCode={null}
      // 隐藏 React Flow 水印（商业项目需购买 Pro 或保留）
      proOptions={{ hideAttribution: true }}
      // 用 CSS 变量覆盖 React Flow 的默认样式，匹配设计系统
      style={
        {
          '--xy-background-color-default': 'transparent',
          '--xy-controls-button-background-color-default': 'var(--background)',
          '--xy-controls-button-background-color-hover-default': 'var(--muted)',
          '--xy-controls-button-border-color-default': 'var(--border)',
          '--xy-controls-box-shadow-default': 'var(--shadow-sm)',
          '--xy-handle-background-color-default': 'var(--background)',
          '--xy-handle-border-color-default': 'var(--border)',
          '--xy-selection-background-color-default':
            'color-mix(in oklch, var(--primary) 8%, transparent)',
          '--xy-selection-border-default': '1px solid var(--primary)',
        } as React.CSSProperties
      }
    >
      {/* 点阵背景 */}
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        className='text-border!'
      />

      {/* 缩放 / 适应视图控件（React Flow 内置，无需自己写） */}
      <Controls showInteractive={false} />

      {/* 自动排列按钮 */}
      <Panel position='top-right'>
        <div className='border-border bg-background flex items-center gap-1 rounded-lg border p-1 shadow-sm'>
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

      {/* 操作提示 */}
      <Panel position='bottom-center'>
        <p className='text-muted-foreground/50 rounded-full px-3 py-1 text-[10px]'>
          拖拽右侧端口连线 &middot; 点击标签选中 &middot; 选中后点 🗑 删除规则
        </p>
      </Panel>
    </ReactFlow>
  )
}

// ─── Export ───────────────────────────────────────────────
export function LogicCanvas() {
  return (
    <ReactFlowProvider>
      <div className='h-full w-full'>
        <LogicFlow />
      </div>
    </ReactFlowProvider>
  )
}
