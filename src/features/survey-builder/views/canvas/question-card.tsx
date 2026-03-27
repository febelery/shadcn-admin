import React, { useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, GripVertical, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getQuestion } from '@/features/survey-builder/questions'
import { useSchemaStore, useUIStore } from '@/features/survey-builder/state'
import {
  type QuestionNode,
  isLayoutNode,
  FILL_IN_SPLIT_RE,
  FILL_IN_TEST_RE,
} from '@/features/survey-builder/types'

/**
 * 外部包装组件 Props
 */
interface QuestionCardProps {
  id: string
  num?: number
}

/**
 * 内部业务组件 Props
 */
interface QuestionCardContentProps {
  id: string
  num?: number
  isDragging: boolean
  dragAttributes: Record<string, any>
  dragListeners: Record<string, any> | undefined
}

/**
 * 题目卡片包装组件 (Sortable Wrapper)
 * 职责：负责与 dnd-kit 交互，管理拖拽状态与占位符样式。
 */
export function QuestionCard({ id, num }: QuestionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={cn(
        'relative transition-all duration-200',
        isDragging && 'z-50 opacity-30 grayscale'
      )}
    >
      <QuestionCardContent
        id={id}
        num={num}
        isDragging={isDragging}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </div>
  )
}

/**
 * 题目内容业务组件 (Memoized Content)
 * 职责：订阅题目数据、处理编辑/删除等业务逻辑，并渲染题目 UI。
 */
const QuestionCardContent = React.memo(function QuestionCardContent({
  id,
  num,
  dragAttributes,
  dragListeners,
}: QuestionCardContentProps) {
  const isSelected = useUIStore((s) => s.selectedNodeId === id)
  const selectNode = useUIStore((s) => s.selectNode)

  // 精细化选择：仅订阅目标节点数据，而非整个节点数组
  const node = useSchemaStore(
    (s) => s.nodes.find((n) => n.id === id) as QuestionNode | undefined
  )

  const removeNode = useSchemaStore((s) => s.removeNode)
  const duplicateNode = useSchemaStore((s) => s.duplicateNode)
  const updateNode = useSchemaStore((s) => s.updateNode)
  const updateNodeConfig = useSchemaStore((s) => s.updateNodeConfig)

  const titleRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 自动滚动到选中项
  useEffect(() => {
    if (isSelected && containerRef.current) {
      const handle = requestAnimationFrame(() => {
        containerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      })
      return () => cancelAnimationFrame(handle)
    }
  }, [isSelected])

  if (!node) return null

  const q = getQuestion(node.type)
  const EditorComponent = q?.editor
  const isLayout = isLayoutNode(node.type)

  const handleConfigChange = (patch: Partial<QuestionNode['config']>) =>
    updateNodeConfig(id, patch)

  const handleNodeChange = (patch: Partial<QuestionNode>) =>
    updateNode(id, patch)

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className={cn(
          'group border-border/40 relative border-b transition-colors duration-200',
          isSelected
            ? 'border-l-primary bg-background z-10 border-l-4 shadow-md'
            : 'bg-background/50 hover:bg-muted/30 border-l-4 border-l-transparent'
        )}
        onClickCapture={() => {
          if (!isSelected) selectNode(id)
        }}
      >
        {/* 拖拽激活手柄 */}
        <div
          {...dragAttributes}
          {...dragListeners}
          className={cn(
            'absolute top-1/2 left-2 -translate-y-1/2 cursor-grab rounded p-1 transition-all',
            'hover:bg-muted hover:text-foreground group-hover:text-muted-foreground/30 text-transparent',
            isSelected && 'text-muted-foreground/50'
          )}
        >
          <GripVertical className='h-4 w-4' />
        </div>

        {/* 右上角操作按键区 */}
        <div
          className={cn(
            'bg-background/95 absolute top-4 right-4 z-10 flex items-center gap-0.5 rounded-md border p-0.5 shadow-sm backdrop-blur-sm transition-all duration-200',
            'translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100',
            isSelected && 'translate-y-0 opacity-100'
          )}
        >
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:bg-muted hover:text-foreground h-7 w-7 transition-colors'
                onClick={() => duplicateNode(id)}
              >
                <Copy className='h-3.5 w-3.5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>复制题目</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-7 w-7 rounded-sm transition-colors'
                onClick={() => removeNode(id)}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>删除题目</TooltipContent>
          </Tooltip>
        </div>

        <div className='px-8 py-8 pl-8 transition-all'>
          {/* 顶部元信息行：题号、类型标签、必填标记 */}
          <div className='mb-3 flex items-center gap-2'>
            {!isLayout && num !== undefined && (
              <span
                className={cn(
                  'flex h-5 min-w-[20px] items-center justify-center rounded px-1.5 font-mono text-[11px] font-bold transition-colors select-none',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground/70'
                )}
              >
                {String(num).padStart(2, '0')}
              </span>
            )}
            <span
              className={cn(
                'text-[10px] font-bold tracking-widest uppercase transition-colors',
                isLayout
                  ? 'bg-muted/50 text-muted-foreground/40 rounded px-1.5 py-0.5'
                  : isSelected
                    ? 'text-primary'
                    : 'text-muted-foreground/60'
              )}
            >
              {q?.meta.label}
            </span>
            {!isLayout && node.required && (
              <Badge
                variant='destructive'
                className='bg-destructive/10 text-destructive hover:bg-destructive/20 ml-auto px-1.5 text-[9px] font-bold tracking-wider uppercase shadow-none'
              >
                必填
              </Badge>
            )}
          </div>

          {/* 标题编辑区域 */}
          {!isLayout && (
            <div className='relative mb-2 min-h-[1.5em] w-full cursor-text leading-snug'>
              {q?.titleMode === 'display' ? (
                !isSelected && <DisplayTitle node={node} />
              ) : (
                <textarea
                  ref={titleRef}
                  className={cn(
                    'placeholder:text-muted-foreground/30 w-full resize-none border-none bg-transparent p-0 ring-0 outline-none',
                    'field-sizing-content min-h-[1.5em] leading-relaxed',
                    'text-foreground text-lg font-medium'
                  )}
                  value={node.title}
                  placeholder='输入问题标题，支持 ()、___ 等占位符...'
                  rows={1}
                  onChange={(e) => updateNode(id, { title: e.target.value })}
                />
              )}
            </div>
          )}

          {/* 描述编辑区域 */}
          {!isLayout &&
            (isSelected ? (
              <textarea
                className='text-muted-foreground/80 placeholder:text-muted-foreground/40 mb-5 field-sizing-content min-h-[1.5em] w-full resize-none border-none bg-transparent p-0 text-sm leading-relaxed ring-0 outline-none focus:outline-none'
                value={node.description ?? ''}
                rows={1}
                placeholder='添加描述说明（可选）...'
                onChange={(e) =>
                  updateNode(id, { description: e.target.value })
                }
              />
            ) : node.description ? (
              <div className='text-muted-foreground/70 mb-5 w-full text-sm leading-relaxed whitespace-pre-wrap'>
                {node.description}
              </div>
            ) : null)}

          {/* 题目独有编辑器/预览区域 */}
          {isSelected && EditorComponent ? (
            <EditorComponent
              node={node}
              onConfigChange={handleConfigChange}
              onNodeChange={handleNodeChange}
            />
          ) : q?.titleMode === 'display' ? null : q?.preview ? (
            <q.preview node={node} />
          ) : null}
        </div>
      </div>
    </TooltipProvider>
  )
})

/**
 * 题目题解解析渲染组件 (如填空题的下划线解析)
 */
const DisplayTitle = React.memo(function DisplayTitle({
  node,
}: {
  node: QuestionNode
}) {
  return (
    <div
      className={cn(
        'text-foreground text-lg font-medium',
        !node.title && 'text-muted-foreground/40 font-normal italic'
      )}
    >
      {node.title
        ? node.title
            .split(FILL_IN_SPLIT_RE)
            .map((part, i) =>
              FILL_IN_TEST_RE.test(part) ? (
                <span
                  key={i}
                  className='border-primary/30 bg-primary/5 mx-1 inline-block min-w-[60px] border-b-2 align-baseline transition-all'
                />
              ) : (
                <span key={i}>{part}</span>
              )
            )
        : '输入问题标题...'}
    </div>
  )
})
