import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, GripVertical, MoreHorizontal, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useBuilderStore,
  useNodeChildren,
} from '@/features/survey-builder/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { QuestionNode } from '@/features/survey-builder/types'
import { QuestionCard } from './question-card'

interface Props {
  node: QuestionNode
}

export function BlockHeader({ node }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const children = useNodeChildren(node.id)
  const { addNode } = useBuilderStore()

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: node.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {/* Block title bar */}
      <div
        className={cn(
          'group relative flex cursor-pointer items-center gap-2 select-none',
          'border-border/30 bg-muted/40 mt-4 border border-b-0 px-3 py-2 pl-8 first:mt-0',
          'hover:bg-muted/60 transition-colors'
        )}
        onClick={() => setCollapsed((v) => !v)}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className='text-border/40 hover:text-muted-foreground absolute left-2 cursor-grab opacity-0 transition group-hover:opacity-100'
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className='h-3.5 w-3.5' />
        </div>

        <span className='text-muted-foreground/50 text-[9px] font-bold tracking-[0.15em] uppercase'>
          区块
        </span>
        <span className='flex-1 truncate text-xs font-semibold tracking-tight'>
          {node.title || '未命名区块'}
        </span>

        <Badge
          variant='secondary'
          className='bg-background/60 text-muted-foreground/50 h-4 rounded px-1.5 font-mono text-[9px] font-bold shadow-none'
        >
          {children.length} 题
        </Badge>

        <div className='flex items-center gap-0.5'>
          <Button
            variant='ghost'
            size='sm'
            className='text-muted-foreground/40 hover:bg-background hover:text-foreground h-6 w-6 rounded p-0 opacity-0 transition group-hover:opacity-100'
            onClick={(e) => {
              e.stopPropagation()
              addNode('text', node.id)
            }}
            title='在此区块末尾添加题目'
          >
            <Plus className='h-3 w-3' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            className='text-muted-foreground/40 hover:bg-background hover:text-foreground h-6 w-6 rounded p-0 opacity-0 transition group-hover:opacity-100'
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className='h-3 w-3' />
          </Button>
          <ChevronDown
            className={cn(
              'text-muted-foreground/50 h-3.5 w-3.5 transition-transform',
              collapsed && '-rotate-90'
            )}
          />
        </div>
      </div>

      {/* Children */}
      <div
        className={cn(
          'border-border/30 overflow-hidden border border-t-0 transition-all duration-200',
          collapsed ? 'max-h-0 opacity-0' : 'max-h-[9000px] opacity-100'
        )}
      >
        {children.length === 0 ? (
          <div className='text-muted-foreground/40 flex items-center justify-center py-6 text-xs'>
            <button
              onClick={(e) => {
                e.stopPropagation()
                addNode('text', node.id)
              }}
              className='border-border/40 hover:border-border hover:text-foreground flex items-center gap-1.5 rounded-lg border border-dashed px-4 py-2 transition'
            >
              <Plus className='h-3 w-3' />
              添加题目到此区块
            </button>
          </div>
        ) : (
          children.map((child) => <QuestionCard key={child.id} node={child} />)
        )}
      </div>
    </div>
  )
}
