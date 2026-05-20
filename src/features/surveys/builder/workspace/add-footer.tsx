import { useDroppable } from '@dnd-kit/core'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { builderWorkspaceAddDropTarget, builderWorkspaceAddHint } from '../ui'
import { WORKSPACE_DROP } from '../dnd'

type Props = {
  sectionId: string
  highlight: boolean
}

/** 工作区底部：分隔线 + 拖放提示（非按钮，仅拖拽时显示放置区） */
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
          className={builderWorkspaceAddDropTarget(isOver)}
          aria-live='polite'
        >
          {isOver ? '松手添加到末尾' : '拖放到此处添加到末尾'}
        </span>
      ) : (
        <span className={builderWorkspaceAddHint}>拖放题型到此处添加</span>
      )}
      <Separator className='flex-1' />
    </div>
  )
}
