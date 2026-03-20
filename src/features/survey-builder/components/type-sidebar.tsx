import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { ChevronLeft, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  QUESTION_TYPES,
  QUESTION_TYPE_CATEGORIES,
  type QuestionTypeConfig,
} from '../constants'
import { useBuilderStore } from '../store'
import type { NodeType } from '../types'

// 单个可拖拽题型项
function DraggableTypeItem({
  item,
  collapsed,
}: {
  item: QuestionTypeConfig
  collapsed: boolean
}) {
  const { addNode, selectedNodeId } = useBuilderStore()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar:${item.type}`,
    data: { type: 'NEW_QUESTION', questionType: item.type },
  })

  const Icon = item.icon

  const btn = (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'group flex w-full cursor-grab items-center gap-2 rounded-md px-2 py-1.5',
        'text-foreground/65 border border-transparent text-xs font-medium select-none',
        'transition-all duration-100',
        'hover:border-border/50 hover:bg-background hover:text-foreground hover:shadow-sm',
        'active:scale-[0.97] active:cursor-grabbing',
        isDragging && 'opacity-30',
        collapsed && 'justify-center'
      )}
      onClick={() =>
        addNode(item.type as NodeType, selectedNodeId ?? undefined)
      }
      title={item.label}
    >
      <Icon
        className={cn(
          'group-hover:text-primary shrink-0 transition-colors',
          collapsed ? 'h-4 w-4' : 'h-3.5 w-3.5',
          'text-primary/50'
        )}
      />
      {!collapsed && (
        <span className='truncate leading-none'>{item.label}</span>
      )}
    </button>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side='right' className='text-xs'>
          <p className='font-semibold'>{item.label}</p>
          {item.description && (
            <p className='text-muted-foreground'>{item.description}</p>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  return btn
}

// 题型侧边栏主组件
export function TypeSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = query
    ? QUESTION_TYPES.filter(
        (t) => t.label.includes(query) || t.description?.includes(query)
      )
    : QUESTION_TYPES

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'border-border/50 bg-muted/20 relative flex shrink-0 flex-col border-r transition-all duration-200',
          collapsed ? 'w-11' : 'w-52'
        )}
      >
        {/* 顶部搜索与折叠控制 */}
        <div
          className={cn(
            'border-border/40 bg-background/60 flex h-10 shrink-0 items-center border-b',
            collapsed ? 'justify-center px-0' : 'gap-2 px-2'
          )}
        >
          {!collapsed && (
            <div className='relative flex-1'>
              <Search className='text-muted-foreground/40 absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
              <Input
                className='bg-background h-8 w-full pl-8 text-xs'
                placeholder='搜索题型…'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className='text-muted-foreground/50 hover:bg-accent hover:text-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded transition'
          >
            <ChevronLeft
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                collapsed && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* 题型列表分类展示 */}
        <div className='scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/30 flex-1 overflow-y-auto py-2'>
          {QUESTION_TYPE_CATEGORIES.map((cat, catIdx) => {
            const items = filtered.filter((t) => t.category === cat)
            if (!items.length) return null

            return (
              <div key={cat} className={cn('px-1.5', catIdx > 0 && 'mt-1')}>
                {!collapsed && (
                  <div className='mb-1 flex items-center gap-2 px-1 pt-2.5'>
                    <span className='text-muted-foreground/40 text-[9px] font-bold tracking-widest whitespace-nowrap uppercase'>
                      {cat}
                    </span>
                    <div className='bg-border/25 h-px flex-1' />
                  </div>
                )}
                {collapsed && catIdx > 0 && (
                  <div className='bg-border/25 mx-auto mt-2 mb-1.5 h-px w-5' />
                )}

                <div
                  className={cn(
                    'grid gap-0.5',
                    collapsed ? 'grid-cols-1' : 'grid-cols-2'
                  )}
                >
                  {items.map((item) => (
                    <DraggableTypeItem
                      key={item.type}
                      item={item}
                      collapsed={collapsed}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {/* 操作提示 */}
          {!collapsed && (
            <div className='mt-4 px-3 pb-2'>
              <p className='text-muted-foreground/35 text-center text-[10px]'>
                点击添加 · 拖拽到画布指定位置
              </p>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
