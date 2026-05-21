import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { WORKSPACE_DROP } from '../shared/dnd-types'

type Props = {
  sectionId: string
  highlight: boolean
}

/** 工作区底部：分隔线 + 拖放提示 */
export function WorkspaceAddFooter({ sectionId, highlight }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `workspace-drop-${sectionId}`,
    data: { type: WORKSPACE_DROP, sectionId },
    disabled: !highlight,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'mt-4 flex items-center gap-3',
        highlight ? 'min-h-12' : 'min-h-8'
      )}
    >
      <Separator className='flex-1' />
      {highlight ? (
        <span
          className={cn(
            'shrink-0 rounded-lg border border-dashed px-3 py-2',
            'text-muted-foreground text-xs leading-none transition-colors duration-150',
            isOver
              ? 'border-primary bg-primary/5 text-foreground'
              : 'border-border/60 bg-muted/20'
          )}
          aria-live='polite'
        >
          {isOver ? '松手添加到末尾' : '拖放到此处添加到末尾'}
        </span>
      ) : (
        <span className='text-muted-foreground shrink-0 px-2 text-xs leading-relaxed opacity-70 select-none'>
          拖放题型到此处添加
        </span>
      )}
      <Separator className='flex-1' />
    </div>
  )
}
