import { useEffect, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, GripVertical, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { QUESTION_TYPE_MAP } from '@/features/survey-builder/constants'
import {
  useBuilderStore,
  useVisibleNodeNumber,
} from '@/features/survey-builder/store'
import type { QuestionNode } from '@/features/survey-builder/types'

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
  const hasOptions = [
    'single_choice',
    'multiple_choice',
    'dropdown',
    'ranking',
    'image_choice',
  ].includes(node.type)

  useEffect(() => {
    if (isSelected && titleRef.current) {
      const el = titleRef.current
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }, [node.title, isSelected])

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
          'group border-border/25 bg-background relative border-b transition-all duration-100',
          // ✅ 选中态：用 primary token，不再硬编码蓝色
          isSelected
            ? 'bg-primary/3 shadow-[inset_2.5px_0_0_var(--color-primary)]'
            : 'hover:bg-muted/50 hover:border-border/60 hover:shadow-sm',
          isDragging && 'z-50 rotate-[0.3deg] opacity-50 shadow-lg'
        )}
        onClick={(e) => {
          e.stopPropagation()
          selectNode(node.id)
        }}
      >
        {/* 拖拽手柄 */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'text-border/40 absolute top-3.5 left-1.5 cursor-grab transition-all',
            'hover:text-muted-foreground opacity-0 group-hover:opacity-100',
            isSelected && 'opacity-50'
          )}
        >
          <GripVertical className='h-4 w-4' />
        </div>

        {/* 右上角操作栏 */}
        <div
          className={cn(
            'absolute top-0 right-0 z-10 flex overflow-hidden rounded-bl-lg',
            'border-border/30 bg-background/95 border-b border-l shadow-sm backdrop-blur-sm',
            'translate-y-0 opacity-0 transition-all duration-150',
            'group-hover:opacity-100',
            isSelected && 'opacity-100'
          )}
        >
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                className='border-border/25 text-muted-foreground/60 hover:bg-muted hover:text-foreground h-7 w-8 items-center justify-center rounded-none border-r transition'
                onClick={(e) => {
                  e.stopPropagation()
                  duplicateNode(node.id)
                }}
              >
                <Copy className='h-3 w-3' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>复制题目</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                className='text-muted-foreground/60 h-7 w-8 items-center justify-center rounded-none transition hover:bg-red-50 hover:text-red-500'
                onClick={(e) => {
                  e.stopPropagation()
                  removeNode(node.id)
                }}
              >
                <Trash2 className='h-3 w-3' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>删除题目</TooltipContent>
          </Tooltip>
        </div>

        {/* 内容区域 */}
        <div className='px-3 py-3 pr-20 pl-7'>
          {/* Meta row */}
          <div className='mb-2 flex items-center gap-1.5'>
            {num !== undefined && (
              <Badge
                variant={isSelected ? 'default' : 'secondary'}
                className={cn(
                  'rounded-sm h-4 w-4 shrink-0 p-0 font-mono text-[9px] font-bold shadow-none',
                  isSelected
                    ? 'bg-primary'
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                {String(num).padStart(2, '0')}
              </Badge>
            )}
            <span
              className={cn(
                'text-[10px] font-medium transition-colors',
                // ✅ 类型标签用 primary token
                isSelected ? 'text-primary/70' : 'text-muted-foreground/50'
              )}
            >
              {typeConfig?.label}
            </span>
            {node.required && (
              <Badge
                variant='destructive'
                className='ml-auto border-none bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-500 shadow-none hover:bg-red-50'
              >
                必填
              </Badge>
            )}
          </div>

          {/* Title */}
          {isSelected ? (
            <textarea
              ref={titleRef}
              className='text-foreground placeholder:text-muted-foreground/30 mb-1.5 w-full resize-none rounded bg-transparent text-sm leading-snug font-medium ring-0 outline-none focus:ring-0 focus:outline-none'
              value={node.title}
              placeholder='输入问题标题...'
              rows={1}
              onChange={(e) => {
                updateNode(node.id, { title: e.target.value })
                e.target.style.height = 'auto'
                e.target.style.height = `${e.target.scrollHeight}px`
              }}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
            />
          ) : (
            <div className='mb-2'>
              {node.required && (
                <span className='mr-1.5 inline-block h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-red-500' />
              )}
              <span
                className={cn(
                  'text-sm leading-snug font-medium',
                  !node.title && 'text-muted-foreground/40 italic'
                )}
              >
                {node.title || '（未填写问题标题）'}
              </span>
            </div>
          )}

          {/* Description input */}
          {isSelected && (
            <input
              className='text-muted-foreground/70 placeholder:text-muted-foreground/30 mb-2.5 w-full rounded bg-transparent text-xs ring-0 outline-none focus:outline-none'
              value={node.description ?? ''}
              placeholder='添加描述说明（可选）...'
              onChange={(e) =>
                updateNode(node.id, { description: e.target.value })
              }
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Question body */}
          {isSelected && hasOptions ? (
            <InlineOptionEditor node={node} />
          ) : (
            <QuestionPreview node={node} />
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

// 行内选项编辑器
function InlineOptionEditor({ node }: { node: QuestionNode }) {
  const { updateNodeConfig } = useBuilderStore()
  const options = node.config.options ?? []
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  const setRef = (id: string) => (el: HTMLInputElement | null) => {
    if (el) inputRefs.current.set(id, el)
    else inputRefs.current.delete(id)
  }

  const save = (opts: typeof options) =>
    updateNodeConfig(node.id, { options: opts })

  const handleChange = (id: string, label: string) => {
    save(
      options.map((o) =>
        o.id === id
          ? {
              ...o,
              label,
              value: label.toLowerCase().replace(/\s+/g, '_') || o.value,
            }
          : o
      )
    )
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const newId = crypto.randomUUID()
      const newOpts = [
        ...options.slice(0, index + 1),
        {
          id: newId,
          label: '',
          value: `opt_${newId.slice(0, 8)}`,
          order: index + 1,
        },
        ...options.slice(index + 1).map((o, i) => ({
          ...o,
          order: index + 2 + i,
        })),
      ]
      save(newOpts)
      setTimeout(() => inputRefs.current.get(newId)?.focus(), 30)
    }

    if (e.key === 'Backspace' && !options[index].label && options.length > 1) {
      e.preventDefault()
      const prevId = index > 0 ? options[index - 1].id : options[1]?.id
      save(options.filter((_, i) => i !== index))
      if (prevId) setTimeout(() => inputRefs.current.get(prevId)?.focus(), 30)
    }
  }

  const addOption = () => {
    const newId = crypto.randomUUID()
    save([
      ...options,
      {
        id: newId,
        label: '',
        value: `opt_${options.length}`,
        order: options.length,
      },
    ])
    setTimeout(() => inputRefs.current.get(newId)?.focus(), 30)
  }

  const remove = (id: string) => {
    if (options.length > 1) save(options.filter((o) => o.id !== id))
  }

  return (
    <div className='flex flex-col' onClick={(e) => e.stopPropagation()}>
      {options.map((opt, i) => (
        <div
          key={opt.id}
          className='group/row hover:bg-muted/40 flex items-center gap-2 rounded px-1 py-0.5 transition'
        >
          <span
            className={cn(
              'border-muted-foreground/25 bg-background group-hover/row:border-muted-foreground/50 h-3.5 w-3.5 shrink-0 border-2 transition-colors',
              node.type === 'single_choice' ? 'rounded-full' : 'rounded-[3px]'
            )}
          />
          <input
            ref={setRef(opt.id)}
            className='text-foreground placeholder:text-muted-foreground/35 min-w-0 flex-1 bg-transparent text-xs outline-none'
            value={opt.label}
            placeholder='输入选项内容...'
            onChange={(e) => handleChange(opt.id, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          />
          <Button
            variant='ghost'
            size='icon'
            className='text-muted-foreground/20 h-5 w-5 shrink-0 opacity-0 transition-all group-hover/row:opacity-100 hover:text-red-500 rounded-sm p-0'
            onClick={() => remove(opt.id)}
            tabIndex={-1}
          >
            <X className='h-3 w-3' />
          </Button>
        </div>
      ))}

      <Button
        variant='ghost'
        size='sm'
        onClick={addOption}
        className='text-muted-foreground/40 hover:bg-muted/40 hover:text-primary mt-1 h-7 gap-1.5 rounded px-1.5 text-[11px] font-medium transition'
      >
        <Plus className='h-3 w-3' />
        添加选项
      </Button>
    </div>
  )
}

// 静态题型预览
function QuestionPreview({ node }: { node: QuestionNode }) {
  const opts = node.config.options ?? []

  switch (node.type) {
    case 'single_choice':
    case 'multiple_choice': {
      const isMulti = node.type === 'multiple_choice'
      return (
        <div className='flex flex-col gap-1'>
          {opts.slice(0, 5).map((opt) => (
            <div
              key={opt.id}
              className='text-muted-foreground/70 flex items-center gap-2 text-xs'
            >
              <span
                className={cn(
                  'border-border/50 h-3.5 w-3.5 shrink-0 border',
                  isMulti ? 'rounded-[3px]' : 'rounded-full'
                )}
              />
              <span className='truncate'>{opt.label}</span>
            </div>
          ))}
          {opts.length > 5 && (
            <span className='text-muted-foreground/40 pl-5 text-[10px]'>
              +{opts.length - 5} 个选项
            </span>
          )}
          {opts.length === 0 && (
            <span className='text-muted-foreground/30 text-[11px] italic'>
              暂无选项，点击卡片添加...
            </span>
          )}
        </div>
      )
    }

    case 'dropdown':
      return (
        <div className='border-border/35 bg-muted/30 text-muted-foreground/40 flex h-7 items-center justify-between rounded-md border px-2.5 text-xs'>
          <span>请选择...</span>
          <span className='text-[10px]'>▾</span>
        </div>
      )

    case 'ranking':
      return (
        <div className='flex flex-col gap-1'>
          {(opts.length > 0
            ? opts
            : [
                { id: '1', label: '选项 A' },
                { id: '2', label: '选项 B' },
              ]
          )
            .slice(0, 3)
            .map((opt: any, i: number) => (
              <div
                key={opt.id}
                className='border-border/30 bg-muted/20 flex items-center gap-2 rounded border px-2 py-1 text-xs'
              >
                <span className='text-muted-foreground/40 font-mono text-[10px] font-bold'>
                  {i + 1}
                </span>
                <span className='text-muted-foreground/70 flex-1'>
                  {opt.label}
                </span>
                <span className='text-muted-foreground/25'>⋮⋮</span>
              </div>
            ))}
        </div>
      )

    case 'image_choice':
      return (
        <div className='grid grid-cols-3 gap-1.5'>
          {(opts.length > 0
            ? opts
            : ([
                { id: '1', label: '选项A' },
                { id: '2', label: '选项B' },
                { id: '3', label: '选项C' },
              ] as any[])
          )
            .slice(0, 3)
            .map((opt: any) => (
              <div
                key={opt.id}
                className='border-border/30 bg-muted/20 flex flex-col items-center gap-1 rounded-md border p-1.5'
              >
                <div className='bg-muted/60 h-10 w-full rounded' />
                <span className='text-muted-foreground/60 text-[10px]'>
                  {opt.label}
                </span>
              </div>
            ))}
        </div>
      )

    case 'text':
      return (
        <div className='border-border/35 bg-muted/25 text-muted-foreground/35 flex h-7 items-center rounded-md border px-2.5 text-xs'>
          请输入...
        </div>
      )

    case 'textarea':
      return (
        <div className='border-border/35 bg-muted/25 text-muted-foreground/35 flex h-14 items-start rounded-md border p-2.5 text-xs'>
          请输入...
        </div>
      )

    case 'number':
      return (
        <div className='border-border/35 bg-muted/25 text-muted-foreground/35 flex h-7 items-center rounded-md border px-2.5 font-mono text-xs'>
          0
        </div>
      )

    case 'fill_in':
      return (
        <p className='text-muted-foreground/60 text-xs leading-relaxed'>
          请在以下括号内填写答案：（
          <span className='border-muted-foreground/30 inline-block min-w-20 border-b align-bottom' />
          ）
        </p>
      )

    case 'date':
      return (
        <div className='border-border/35 bg-muted/25 text-muted-foreground/40 flex h-7 items-center gap-2 rounded-md border px-2.5 text-xs'>
          <span>📅</span>YYYY / MM / DD
        </div>
      )

    case 'date_range':
      return (
        <div className='border-border/35 bg-muted/25 text-muted-foreground/40 flex h-7 items-center gap-2 rounded-md border px-2.5 text-xs'>
          <span>📅</span>开始日期 — 结束日期
        </div>
      )

    case 'time':
      return (
        <div className='border-border/35 bg-muted/25 text-muted-foreground/40 flex h-7 items-center gap-2 rounded-md border px-2.5 text-xs'>
          <span>🕐</span>HH : MM
        </div>
      )

    case 'time_range':
      return (
        <div className='border-border/35 bg-muted/25 text-muted-foreground/40 flex h-7 items-center gap-2 rounded-md border px-2.5 text-xs'>
          <span>🕐</span>HH:MM — HH:MM
        </div>
      )

    case 'rating': {
      const count = node.config.starCount ?? 5
      const shape = (node.config as any).starShape ?? 'star'
      const filled = Math.ceil(count / 2)
      const icons: Record<string, string> = {
        star: '★',
        heart: '♥',
        thumb: '👍',
        circle: '●',
      }
      return (
        <div className='flex items-center gap-1'>
          {Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className={cn(
                'text-lg leading-none transition-colors',
                i < filled ? 'text-amber-400/70' : 'text-muted-foreground/15'
              )}
            >
              {icons[shape] || '★'}
            </span>
          ))}
        </div>
      )
    }

    case 'nps':
      return (
        <div>
          <div className='flex gap-0.5'>
            {Array.from({ length: 11 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'flex flex-1 items-center justify-center rounded py-1 font-mono text-[10px] font-semibold',
                  i <= 6
                    ? 'bg-red-50 text-red-400/80 dark:bg-red-950/30'
                    : i <= 8
                      ? 'bg-amber-50 text-amber-500/80 dark:bg-amber-950/30'
                      : 'bg-green-50 text-green-500/80 dark:bg-green-950/30'
                )}
              >
                {i}
              </div>
            ))}
          </div>
          <div className='text-muted-foreground/40 mt-1 flex justify-between text-[9px]'>
            <span>极不推荐</span>
            <span>极力推荐</span>
          </div>
        </div>
      )

    case 'matrix_single':
    case 'matrix_multiple': {
      const rows = node.config.rows ?? []
      const cols = node.config.columns ?? []
      const showRows = rows.slice(0, 3)
      const showCols = cols.slice(0, 4)
      const isMulti = node.type === 'matrix_multiple'

      if (!showRows.length || !showCols.length) {
        return (
          <div className='border-border/30 text-muted-foreground/40 rounded-md border p-3 text-center text-xs'>
            {rows.length} 行 × {cols.length} 列（点击卡片编辑）
          </div>
        )
      }

      return (
        <div className='border-border/30 overflow-hidden rounded-md border text-[10px]'>
          <div className='bg-muted/50 flex'>
            <div className='border-border/25 w-20 shrink-0 border-r p-1.5' />
            {showCols.map((c) => (
              <div
                key={c.id}
                className='border-border/25 text-muted-foreground/60 flex-1 truncate border-r p-1.5 text-center'
              >
                {c.label}
              </div>
            ))}
          </div>
          {showRows.map((r) => (
            <div key={r.id} className='border-border/25 flex border-t'>
              <div className='border-border/25 text-muted-foreground/60 w-20 shrink-0 truncate border-r p-1.5'>
                {r.label}
              </div>
              {showCols.map((c) => (
                <div
                  key={c.id}
                  className='border-border/25 flex flex-1 items-center justify-center border-r py-1.5'
                >
                  <span
                    className={cn(
                      'border-border/40 h-3 w-3 border',
                      isMulti ? 'rounded-sm' : 'rounded-full'
                    )}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )
    }

    case 'file_upload':
      return (
        <div className='border-border/35 text-muted-foreground/40 flex h-14 flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed text-xs'>
          <span className='text-base'>📎</span>
          <span>点击或拖拽文件至此</span>
        </div>
      )

    case 'signature':
      return (
        <div className='border-border/35 bg-muted/15 flex h-16 items-center justify-center rounded-md border'>
          <span className='text-muted-foreground/30 text-sm'>
            ✍️ 电子签名区域
          </span>
        </div>
      )

    case 'geo_location':
      return (
        <div className='bg-muted/25 text-muted-foreground/40 flex h-14 items-center justify-center gap-2 rounded-md text-xs'>
          <span>📍</span>
          <span>点击获取当前位置</span>
        </div>
      )

    case 'repeater':
      return (
        <div className='space-y-1.5'>
          <div className='border-border/30 bg-muted/20 text-muted-foreground/60 rounded border p-2 text-xs'>
            第 1 条记录（示例行）
          </div>
          <button className='text-primary/70 flex items-center gap-1 text-[11px] font-medium'>
            <Plus className='h-3 w-3' />
            {node.config.addLabel ?? '添加一条'}
          </button>
        </div>
      )

    case 'group':
    case 'sub_question':
    case 'linked_choice':
      return (
        <div className='border-border/30 bg-muted/20 text-muted-foreground/50 rounded-md border p-2 text-xs'>
          {node.type === 'group' && '题组容器 — 可包含多道子题'}
          {node.type === 'sub_question' && '父题答案触发展开'}
          {node.type === 'linked_choice' && '选项来源于另一道题的答案'}
        </div>
      )

    case 'rich_text':
      return (
        <div className='border-border/25 bg-muted/15 text-muted-foreground/50 rounded-md border px-3 py-2 text-xs leading-relaxed'>
          富文本说明区域 — 支持加粗、链接等格式
        </div>
      )

    default:
      return null
  }
}
