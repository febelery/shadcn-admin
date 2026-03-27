import { useState, useMemo } from 'react'
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
import { ALL_QUESTION_ITEMS } from '../questions'
import { useSchemaStore, useUIStore } from '../state'
import { type NodeType, QUESTION_TYPE_CATEGORIES } from '../types'

// 单个可拖拽题型项
function DraggableTypeItem({
  item,
  collapsed,
}: {
  item: any
  collapsed: boolean
}) {
  const { addNode } = useSchemaStore()
  const { selectedNodeId } = useUIStore()
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
        'group flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5',
        'text-muted-foreground text-xs font-medium transition-all select-none',
        'hover:bg-muted/50 hover:text-foreground',
        'active:bg-muted/80 active:scale-[0.98]',
        isDragging && 'opacity-30',
        collapsed && 'justify-center px-0'
      )}
      onClick={() =>
        addNode(item.type as NodeType, { afterId: selectedNodeId })
      }
      title={item.label}
    >
      <Icon
        className={cn(
          'text-muted-foreground/50 group-hover:text-foreground shrink-0 transition-colors',
          collapsed ? 'h-4 w-4' : 'h-4 w-4'
        )}
      />
      {!collapsed && <span className='truncate'>{item.label}</span>}
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

  // 核心重构：使用静态常量并配合 useMemo 过滤
  const allQuestions = useMemo(
    () =>
      ALL_QUESTION_ITEMS.map((q) => ({
        type: q.type,
        label: q.meta.label,
        description: q.meta.description || '',
        icon: q.meta.icon as any,
        category: q.meta.category,
      })),
    []
  )

  const filtered = useMemo(
    () =>
      query
        ? allQuestions.filter(
            (t) => t.label.includes(query) || t.description?.includes(query)
          )
        : allQuestions,
    [query, allQuestions]
  )

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'bg-background relative hidden shrink-0 flex-col border-r transition-all duration-300 md:flex',
          collapsed ? 'w-12' : 'w-56'
        )}
      >
        {/* 顶部搜索与折叠控制 */}
        <div
          className={cn(
            'flex h-14 shrink-0 items-center border-b',
            collapsed ? 'justify-center px-0' : 'gap-2 px-3'
          )}
        >
          {!collapsed && (
            <div className='relative flex-1'>
              <Search className='text-muted-foreground/50 absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
              <Input
                className='bg-muted/40 hover:bg-muted/60 focus-visible:bg-background focus-visible:border-border h-7 w-full rounded-md border-transparent pl-8 text-xs shadow-none transition-colors'
                placeholder='搜索题型…'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className='text-muted-foreground/50 hover:bg-muted hover:text-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors'
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform duration-300',
                collapsed && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* 题型列表分类展示 */}
        <div className='scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/30 flex-1 overflow-y-auto p-2'>
          {QUESTION_TYPE_CATEGORIES.map((cat, catIdx) => {
            const items = filtered.filter((t) => t.category === cat)
            if (!items.length) return null

            return (
              <div key={cat} className={cn(catIdx > 0 && 'mt-4')}>
                {!collapsed && (
                  <div className='mt-2 mb-1.5 flex items-center px-2'>
                    <span className='text-muted-foreground/50 text-[10px] font-semibold tracking-wider uppercase'>
                      {cat}
                    </span>
                  </div>
                )}
                {collapsed && catIdx > 0 && (
                  <div className='bg-border/40 mx-auto mt-2 mb-1 h-px w-6' />
                )}

                <div
                  className={cn(
                    'grid',
                    collapsed
                      ? 'grid-cols-1 gap-1'
                      : 'grid-cols-2 gap-x-1 gap-y-0.5'
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
        </div>
      </aside>
    </TooltipProvider>
  )
}
