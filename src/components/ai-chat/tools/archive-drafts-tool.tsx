import { ArchiveIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import type { ChatPart, ToolPartContext } from './types'

// Only the pending approval is a block; every other state renders as a Trace line.
export function renderArchiveDraftsTool(
  part: ChatPart,
  context: ToolPartContext
) {
  if (part.type !== 'tool-archiveDrafts') return null
  if (part.state !== 'approval-requested') return null

  return (
    <Item variant='outline' size='sm'>
      <ItemMedia variant='icon'>
        <ArchiveIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>归档 {part.input.count} 篇草稿？</ItemTitle>
        <ItemDescription>该操作会更新本地草稿箱的数据状态。</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          size='sm'
          variant='outline'
          onClick={() =>
            context.addToolApprovalResponse({
              id: part.approval.id,
              approved: false,
            })
          }
        >
          拒绝
        </Button>
        <Button
          size='sm'
          onClick={() =>
            context.addToolApprovalResponse({
              id: part.approval.id,
              approved: true,
            })
          }
        >
          批准
        </Button>
      </ItemActions>
    </Item>
  )
}
