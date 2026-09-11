import { ShieldAlert, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ChatPart, ToolPartContext } from './types'

/**
 * 草稿归档工具 (archiveDrafts)
 * - 当 state 为 approval-requested 时，展示人工授权卡片
 * - 其它状态时展示紧凑的工具执行状态胶囊
 */
export function renderArchiveDraftsTool(
  part: ChatPart,
  context: ToolPartContext
) {
  if (part.type !== 'tool-archiveDrafts') return null

  if (part.state === 'approval-requested') {
    return (
      <div className='my-2 space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs'>
        <div className='flex items-center gap-2 font-medium text-amber-600 dark:text-amber-400'>
          <ShieldAlert className='size-4' />
          <span>敏感操作授权确认</span>
        </div>
        <p className='text-muted-foreground leading-relaxed'>
          智能助手请求为您安全归档{' '}
          <strong className='text-foreground'>{part.input.count}</strong>{' '}
          篇草稿。该操作将更新本地数据状态，请确认是否允许执行。
        </p>
        <div className='flex items-center gap-2 pt-1'>
          <Button
            size='sm'
            className='h-8 text-xs font-medium'
            onClick={() =>
              context.addToolApprovalResponse({
                id: part.approval.id,
                approved: true,
              })
            }
          >
            批准
          </Button>
          <Button
            size='sm'
            variant='outline'
            className='h-8 text-xs'
            onClick={() =>
              context.addToolApprovalResponse({
                id: part.approval.id,
                approved: false,
              })
            }
          >
            拒绝
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='text-muted-foreground/80 bg-muted/40 my-1.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px]'>
      <Wrench className='text-muted-foreground size-3' />
      <span>工具执行: archiveDrafts ({part.state})</span>
    </div>
  )
}
