import { useRef, useCallback } from 'react'
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
import { useQuestionIndexMap } from '@/features/survey-builder/state/selectors'
import {
  type QuestionNode,
  isLayoutNode,
  FILL_IN_SPLIT_RE,
  FILL_IN_TEST_RE,
} from '@/features/survey-builder/types'

interface Props {
  node: QuestionNode
}

export function QuestionCard({ node }: Props) {
  const { selectedNodeId, selectNode } = useUIStore()
  const { removeNode, duplicateNode, updateNode, updateNodeConfig } =
    useSchemaStore()
  const numMap = useQuestionIndexMap()
  const isSelected = selectedNodeId === node.id
  const num = numMap[node.id]

  const titleRef = useRef<HTMLTextAreaElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id })

  const q = getQuestion(node.type)
  const EditorComponent = q?.editor
  const isLayout = isLayoutNode(node.type)

  const handleConfigChange = useCallback(
    (patch: Partial<QuestionNode['config']>) =>
      updateNodeConfig(node.id, patch),
    [node.id, updateNodeConfig]
  )

  const handleNodeChange = useCallback(
    (patch: Partial<QuestionNode>) => updateNode(node.id, patch),
    [node.id, updateNode]
  )

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={cn(
          'group border-border/40 relative border-b transition-all duration-200',
          isSelected
            ? 'border-l-primary bg-background z-10 border-l-4 shadow-md'
            : 'bg-background/50 hover:bg-muted/30 border-l-4 border-l-transparent',
          isDragging &&
            'ring-border z-50 rotate-1 opacity-90 shadow-xl ring-1 shadow-black/5'
        )}
        onClickCapture={() => {
          if (!isSelected) selectNode(node.id)
        }}
      >
        {/* 拖拽手柄 */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'absolute top-1/2 left-2 -translate-y-1/2 cursor-grab rounded p-1 transition-all',
            'hover:bg-muted hover:text-foreground group-hover:text-muted-foreground/30 text-transparent',
            isSelected && 'text-muted-foreground/50'
          )}
        >
          <GripVertical className='h-4 w-4' />
        </div>

        {/* 右上角操作栏 */}
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
                onClick={() => {
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
                onClick={() => {
                  removeNode(node.id)
                }}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>删除题目</TooltipContent>
          </Tooltip>
        </div>

        <div className='px-8 py-8 transition-all lg:pr-24 pl-8'>
          {/* Meta row */}
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

          {/* Title */}
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
                  onChange={(e) =>
                    updateNode(node.id, { title: e.target.value })
                  }
                />
              )}
            </div>
          )}

          {/* Description */}
          {!isLayout &&
            (isSelected ? (
              <textarea
                className='text-muted-foreground/80 placeholder:text-muted-foreground/40 mb-5 field-sizing-content min-h-[1.5em] w-full resize-none border-none bg-transparent p-0 text-sm leading-relaxed ring-0 outline-none focus:outline-none'
                value={node.description ?? ''}
                rows={1}
                placeholder='添加描述说明（可选）...'
                onChange={(e) =>
                  updateNode(node.id, { description: e.target.value })
                }
              />
            ) : node.description ? (
              <div className='text-muted-foreground/70 mb-5 w-full text-sm leading-relaxed whitespace-pre-wrap'>
                {node.description}
              </div>
            ) : null)}

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
}

/**
 * 填空风格解析渲染逻辑
 */
function DisplayTitle({ node }: { node: QuestionNode }) {
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
}
