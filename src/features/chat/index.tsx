import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai'
import { History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessageScroller } from '@/components/ui/chat'
import { PageLayout } from '@/components/layout/page-layout'
import { ChatHistorySheet } from './components/chat-history-sheet'
import { ChatInput } from './components/chat-input'
import { ChatMessageList } from './components/chat-message-list'
import { scriptedChat, scriptedChatFallback } from './data/scripted-chat'
import type { AttachmentItem, ChatMessage } from './data/types'

export function ChatPage() {
  const [input, setInput] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    addToolApprovalResponse,
    addToolOutput,
    error,
  } = useChat<ChatMessage>({
    messages: [],
    transport: scriptedChat.transport({
      fallback: scriptedChatFallback,
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  })
  const busy = status === 'submitted' || status === 'streaming'

  const submit = (
    overrideText?: string,
    attachments: AttachmentItem[] = []
  ) => {
    const text = (overrideText ?? input).trim()
    if ((!text && attachments.length === 0) || busy) return
    setInput('')

    const parts: ChatMessage['parts'] = []
    for (const att of attachments) {
      parts.push({
        type: 'file',
        filename: att.name,
        mediaType: att.mediaType,
        url: att.url ?? '',
      })
    }
    if (text) {
      parts.push({ type: 'text', text })
    }

    void sendMessage({ role: 'user', parts })
  }

  const handleNewChat = () => {
    setMessages([])
    setInput('')
  }

  const handleResetChat = () => {
    setMessages([])
    setInput('')
  }

  return (
    <PageLayout
      variant='fixed'
      fluid
      className='bg-background flex h-full min-h-0 flex-col p-0'
    >
      <div className='relative flex min-h-0 flex-1 flex-col'>
        {/* 页面右上角历史记录图标按钮 */}
        <div className='absolute top-3 right-4 z-20 sm:top-4 sm:right-6'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='hover:bg-muted/80 bg-background/80 text-muted-foreground hover:text-foreground size-8 rounded-lg border shadow-2xs backdrop-blur-xs transition-colors'
            onClick={() => setHistoryOpen(true)}
            title='历史记录'
            aria-label='打开对话历史'
          >
            <History className='size-4' />
          </Button>
        </div>

        <MessageScroller className='px-4 sm:px-6'>
          <div className='mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col'>
            <ChatMessageList
              messages={messages}
              error={error}
              onSelectPrompt={submit}
              onApprove={(id, approved) =>
                addToolApprovalResponse({ id, approved })
              }
              onAnswer={(id, answers) =>
                addToolOutput({
                  tool: 'askQuestions',
                  toolCallId: id,
                  output: { answers },
                })
              }
            />
          </div>
        </MessageScroller>

        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={(attachments) => submit(undefined, attachments)}
          onStop={stop}
          busy={busy}
          hasMessages={messages.length > 0}
          onReset={handleResetChat}
          onNewChat={handleNewChat}
        />

        {/* 历史对话抽屉 */}
        <ChatHistorySheet open={historyOpen} onOpenChange={setHistoryOpen} />
      </div>
    </PageLayout>
  )
}
