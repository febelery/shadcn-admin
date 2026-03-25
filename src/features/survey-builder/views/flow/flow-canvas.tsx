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
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type EdgeProps,
  type OnNodeDrag,
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
import { useQuestionNodes } from '@/features/survey-builder/state/selectors'
import {
  type QuestionNode,
  FLOW_ACTION_CONFIG,
  FALLBACK_ACTION_CONFIG,
} from '@/features/survey-builder/types'

const NODE_W = 220
const NODE_H = 84

type QuestionNodeData = { node: QuestionNode; num: number }
type FlowEdgeData = { ruleId: string; actionType: string; ruleName: string }

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  if (nodes.length === 0) return { nodes, edges }

  // 1. 将节点按连通性分组 (BFS)
  const adj = new Map<string, string[]>()
  nodes.forEach((n) => adj.set(n.id, []))
  edges.forEach((e) => {
    adj.get(e.source)?.push(e.target)
    adj.get(e.target)?.push(e.source)
  })

  const visited = new Set<string>()
  const components: string[][] = []

  // 按照 nodes 原始顺序（即题目顺序）遍历，保证布局顺序的可预测性
  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      const component: string[] = []
      const queue = [n.id]
      visited.add(n.id)
      while (queue.length > 0) {
        const id = queue.shift()!
        component.push(id)
        adj.get(id)?.forEach((neighbor) => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            queue.push(neighbor)
          }
        })
      }
      components.push(component)
    }
  })

  // 2. 对每个连通分量独立进行 Dagre 布局
  const layoutedComponents = components.map((compIds) => {
    const compNodes = nodes.filter((n) => compIds.includes(n.id))
    const compEdges = edges.filter(
      (e) => compIds.includes(e.source) && compIds.includes(e.target)
    )

    const g = new dagre.graphlib.Graph()
    // 使用 LR (Left to Right) 布局，匹配节点左右两侧的 Handle
    g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 60 })
    g.setDefaultEdgeLabel(() => ({}))

    compNodes.forEach((n) => {
      g.setNode(n.id, {
        width: n.measured?.width ?? NODE_W,
        height: n.measured?.height ?? NODE_H,
      })
    })
    compEdges.forEach((e) => g.setEdge(e.source, e.target))

    dagre.layout(g)

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    const nodeRelPositions = new Map<string, { x: number; y: number }>()

    compNodes.forEach((n) => {
      const { x, y } = g.node(n.id)
      const w = n.measured?.width ?? NODE_W
      const h = n.measured?.height ?? NODE_H
      const posX = x - w / 2
      const posY = y - h / 2
      nodeRelPositions.set(n.id, { x: posX, y: posY })

      minX = Math.min(minX, posX)
      minY = Math.min(minY, posY)
      maxX = Math.max(maxX, posX + w)
      maxY = Math.max(maxY, posY + h)
    })

    return {
      nodeIds: compIds,
      positions: nodeRelPositions,
      width: maxX - minX,
      height: maxY - minY,
      offset: { x: minX, y: minY },
    }
  })

  // 3. 将这些布局好的分量按网格排列，避免一行太长
  const MAX_COMP_PER_ROW = 3 // 每行最多放几个独立分量
  const GAP_X = 160
  const GAP_Y = 120

  let currentX = 0
  let currentY = 0
  let rowMaxHeight = 0
  let colIndex = 0

  const finalNodePositions = new Map<string, { x: number; y: number }>()

  layoutedComponents.forEach((comp) => {
    // 换行逻辑
    if (colIndex > 0 && colIndex >= MAX_COMP_PER_ROW) {
      currentX = 0
      currentY += rowMaxHeight + GAP_Y
      rowMaxHeight = 0
      colIndex = 0
    }

    comp.nodeIds.forEach((id) => {
      const relPos = comp.positions.get(id)!
      finalNodePositions.set(id, {
        x: currentX + (relPos.x - comp.offset.x),
        y: currentY + (relPos.y - comp.offset.y),
      })
    })

    currentX += comp.width + GAP_X
    rowMaxHeight = Math.max(rowMaxHeight, comp.height)
    colIndex++
  })

  return {
    nodes: nodes.map((n) => ({
      ...n,
      position: finalNodePositions.get(n.id) || n.position,
    })),
    edges,
  }
}

// 自定义题目节点
const QuestionNodeComponent = memo(function QuestionNode({
  data,
  selected,
}: NodeProps) {
  const { node, num } = data as QuestionNodeData
  const meta = getQuestion(node.type)?.meta
  const Icon = meta?.icon
  const { selectNode } = useUIStore()

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
      <Handle
        type='target'
        position={Position.Left}
        className={cn(
          'bg-background! h-3! w-3! border-2! transition-colors',
          'border-border! hover:border-primary! hover:bg-primary/10!'
        )}
      />
      <div className='px-3 py-2.5'>
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

// 自定义逻辑连线
function FlowEdgeComponent({
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
  const { removeRule } = useFlowStore()
  const { setActiveRule } = useUIStore()
  const { ruleId, actionType, ruleName } = (data ?? {}) as FlowEdgeData
  const meta = FLOW_ACTION_CONFIG[actionType] ?? FALLBACK_ACTION_CONFIG

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
          stroke: meta.cssVar,
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
            style={{ borderColor: meta.cssVar, color: meta.cssVar }}
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

const nodeTypes = { questionNode: QuestionNodeComponent }
const edgeTypes = { flowEdge: FlowEdgeComponent }

// 流程图核心视图
function FlowView() {
  const nodes = useFlowStore(useShallow((s) => s.nodes))
  const edges = useFlowStore(useShallow((s) => s.edges))
  const onNodesChange = useFlowStore((s) => s.onNodesChange)
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange)
  const setNodes = useFlowStore((s) => s.setNodes)
  const addRule = useFlowStore((s) => s.addRule)
  const { updateExtensions } = useSchemaStore()
  const visibleNodes = useQuestionNodes()
  const { fitView } = useReactFlow()

  // 1. 内容持久化：位置信息归于 SurveySchema.extensions
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
    const { nodes: ln } = getLayoutedElements(nodes, edges)
    const posMap: Record<string, { x: number; y: number }> = {}
    ln.forEach((n: Node) => {
      posMap[n.id] = n.position
    })
    updateExtensions({ flowPositions: posMap })
    setNodes(() => ln)
    requestAnimationFrame(() => fitView({ padding: 0.15, duration: 400 }))
  }, [nodes, edges, setNodes, fitView, updateExtensions])

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
      deleteKeyCode={null}
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
      <Panel position='bottom-center'>
        <p className='text-muted-foreground/50 rounded-full px-3 py-1 text-[10px]'>
          拖拽右侧端口连线 &middot; 点击标签选中 &middot; 选中后点 🗑 删除规则
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
