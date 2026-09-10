import { Chat } from '@/components/chat'
import { PageLayout } from '@/components/layout/page-layout'

export function ChatPage() {
  return (
    <PageLayout
      variant='fixed'
      fluid
      className='flex h-full min-h-0 flex-col rounded-[inherit] p-0'
    >
      <div className='relative flex min-h-0 flex-1 flex-col'>
        <Chat />
      </div>
    </PageLayout>
  )
}
