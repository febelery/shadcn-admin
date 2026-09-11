import { AIChat } from '@/components/ai-chat'
import { PageLayout } from '@/components/layout/page-layout'

export function AIChatPage() {
  return (
    <PageLayout
      variant='fixed'
      fluid
      className='flex h-full min-h-0 flex-col rounded-[inherit] p-0'
    >
      <div className='relative flex min-h-0 flex-1 flex-col'>
        <AIChat />
      </div>
    </PageLayout>
  )
}

export const ChatPage = AIChatPage
