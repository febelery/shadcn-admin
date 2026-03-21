import { useEffect, useRef } from 'react'
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
import {
  QUESTION_TYPE_MAP,
  isLayoutNode,
} from '@/features/survey-builder/constants'
import {
  useBuilderStore,
  useVisibleNodeNumber,
} from '@/features/survey-builder/store'
import type { QuestionNode } from '@/features/survey-builder/types'
import { QuestionPreview } from './question-preview'

// Editors
import { InlineOptionEditor } from '../editors/choice-editor'
import { VisualMatrixEditor } from '../editors/matrix-editor'
import { InlineImageChoiceEditor } from '../editors/image-choice-editor'
import { InlineRankingEditor } from '../editors/ranking-editor'
import { InlineRatingEditor } from '../editors/rating-editor'
import { InlineNpsEditor } from '../editors/nps-editor'
import { InlineRichTextEditor } from '../editors/rich-text-editor'


interface Props {
  node: QuestionNode
}

// 问卷题目卡片主组件
export function QuestionCard({ node }: Props) {
  const { selectedNodeId, selectNode, removeNode, duplicateNode, updateNode } =
    useBuilderStore()
  const numMap = useVisibleNodeNumber()
  const isSelected = selectedNodeId === node.id
  const num = numMap[node.id]

  const titleRef = useRef<HTMLTextAreaElement>(null)
  const prevSelected = useRef(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id })

  const typeConfig = QUESTION_TYPE_MAP[node.type]
  const hasOptions = ['single_choice', 'multiple_choice', 'dropdown'].includes(
    node.type
  )
  const isMatrix = ['matrix_single', 'matrix_multiple'].includes(node.type)
  const isImageChoice = node.type === 'image_choice'
  const isRanking = node.type === 'ranking'
  const isFillIn = node.type === 'fill_in'
  const isRating = node.type === 'rating'
  const isNPS = node.type === 'nps'
  const isLayout = isLayoutNode(node.type)

  // 解析填空内容的正则：支持 (), （）, 连续下划线 ___, 连续全角下划线 ＿＿＿
  const FILL_IN_REGEX = /(\(\)|（）|__+|＿＿+)/g

  useEffect(() => {
    if (isSelected && !prevSelected.current) {
      setTimeout(() => titleRef.current?.focus(), 30)
    }
    prevSelected.current = isSelected
  }, [isSelected])

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={cn(
          'group relative border-b border-border/40 transition-all duration-200',
          isSelected
            ? 'z-10 border-l-4 border-l-primary bg-background shadow-md'
            : 'border-l-4 border-l-transparent bg-background/50 hover:bg-muted/30',
          isDragging &&
            'z-50 rotate-1 opacity-90 shadow-xl shadow-black/5 ring-1 ring-border'
        )}
        onClick={(e) => {
          e.stopPropagation()
          if (!isSelected) {
            selectNode(node.id)
          }
        }}
        onFocusCapture={() => {
          if (!isSelected) {
            selectNode(node.id)
          }
        }}
      >
        {/* 拖拽手柄 */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'absolute left-2 top-1/2 -translate-y-1/2 cursor-grab rounded p-1 transition-all',
            'text-transparent hover:bg-muted hover:text-foreground group-hover:text-muted-foreground/30',
            isSelected && 'text-muted-foreground/50'
          )}
        >
          <GripVertical className='h-4 w-4' />
        </div>

        {/* 右上角操作栏 */}
        <div
          className={cn(
            'absolute right-4 top-4 z-10 flex items-center gap-0.5 rounded-md border bg-background/95 p-0.5 shadow-sm backdrop-blur-sm transition-all duration-200',
            'translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100',
            isSelected && 'translate-y-0 opacity-100'
          )}
        >
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-7 w-7 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                onClick={(e) => {
                  e.stopPropagation()
                  duplicateNode(node.id)
                }}
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
                onClick={(e) => {
                  e.stopPropagation()
                  removeNode(node.id)
                }}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>删除题目</TooltipContent>
          </Tooltip>
        </div>

        {/* 内容区域 */}
        <div className={cn('px-8 py-8 lg:pr-24 transition-all', isSelected ? 'pl-8' : 'pl-8')}>
          {/* Meta row */}
          <div className='mb-3 flex items-center gap-2'>
            {!isLayout && num !== undefined && (
              <span
                className={cn(
                  'flex h-5 min-w-[20px] items-center justify-center rounded px-1.5 font-mono text-[11px] font-bold select-none transition-colors',
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
                  : isSelected ? 'text-primary' : 'text-muted-foreground/60'
              )}
            >
              {typeConfig?.label}
            </span>
            {!isLayout && node.required && (
              <Badge
                variant='destructive'
                className='ml-auto bg-destructive/10 px-1.5 text-[9px] font-bold tracking-wider text-destructive hover:bg-destructive/20 uppercase shadow-none'
              >
                必填
              </Badge>
            )}
          </div>

          {/* Title Area */}
          {!isLayout && (
            <div className='relative mb-2 min-h-[1.5em] w-full cursor-text leading-snug'>
              {isFillIn && !isSelected ? (
                <div
                  className={cn(
                    'text-foreground text-lg font-medium',
                    !node.title && 'text-muted-foreground/40 italic font-normal'
                  )}
                >
                  {node.title
                    ?.split(FILL_IN_REGEX)
                    .map((part, i) =>
                      FILL_IN_REGEX.test(part) ? (
                        <span
                          key={i}
                          className='mx-1 inline-block min-w-[60px] border-b-2 border-primary/30 bg-primary/5 align-baseline transition-all'
                        />
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    ) || '输入问题标题...'}
                </div>
              ) : (
                <textarea
                  ref={titleRef}
                  className={cn(
                    'w-full resize-none border-none bg-transparent p-0 outline-none ring-0 placeholder:text-muted-foreground/30',
                    'field-sizing-content min-h-[1.5em] leading-relaxed',
                    'text-foreground text-lg font-medium'
                  )}
                  value={node.title}
                  placeholder='输入问题标题，支持 ()、___ 等占位符...'
                  rows={1}
                  onChange={(e) => updateNode(node.id, { title: e.target.value })}
                  autoFocus={isFillIn && isSelected}
                />
              )}
            </div>
          )}

          {/* Description */}
          {!isLayout && (
            isSelected ? (
              <textarea
                className='mb-5 w-full resize-none border-none bg-transparent p-0 text-sm leading-relaxed text-muted-foreground/80 outline-none ring-0 placeholder:text-muted-foreground/40 focus:outline-none field-sizing-content min-h-[1.5em]'
                value={node.description ?? ''}
                rows={1}
                placeholder='添加描述说明（可选）...'
                onChange={(e) =>
                  updateNode(node.id, { description: e.target.value })
                }
              />
            ) : node.description ? (
              <div className='mb-5 w-full whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground/70'>
                {node.description}
              </div>
            ) : null
          )}

          {node.type === 'rich_text' && isSelected ? (
            <InlineRichTextEditor node={node} />
          ) : (
            isFillIn ? null : isSelected && hasOptions ? (
              <InlineOptionEditor node={node} />
            ) : isSelected && isMatrix ? (
              <VisualMatrixEditor node={node} />
            ) : isSelected && isImageChoice ? (
              <InlineImageChoiceEditor node={node} />
            ) : isSelected && isRanking ? (
              <InlineRankingEditor node={node} />
            ) : isSelected && isRating ? (
              <InlineRatingEditor node={node} />
            ) : isSelected && isNPS ? (
              <InlineNpsEditor node={node} />
            ) : (
              <QuestionPreview node={node} />
            )
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}


