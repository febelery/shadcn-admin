import { RotateCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AIChat } from '@/components/ai-chat'
import { useChatStore } from '@/components/ai-chat/core/chat-store'
import { PageLayout } from '@/components/layout/page-layout'

export function AIChatPage() {
  const resetStore = useChatStore((state) => state.reset)

  return (
    <PageLayout
      variant='fixed'
      title='AI 助手'
      description='让助手阅读代码、运行命令、做出修改。'
      actions={
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='outline'
                size='icon'
                aria-label='重置对话'
                onClick={() => resetStore('default')}
              >
                <RotateCwIcon />
              </Button>
            }
          />
          <TooltipContent>
            <p>重置</p>
          </TooltipContent>
        </Tooltip>
      }
    >
      <div className='relative flex min-h-0 flex-1 flex-col pt-4'>
        <AIChat />
      </div>
    </PageLayout>
  )
}

export const ChatPage = AIChatPage
