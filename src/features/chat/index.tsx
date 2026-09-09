import { useRef, useState } from 'react'
import { History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessageScroller } from '@/components/ui/chat'
import { PageLayout } from '@/components/layout/page-layout'
import { ChatHistorySheet } from './components/chat-history-sheet'
import { ChatInput } from './components/chat-input'
import { ChatMessageList } from './components/chat-message-list'
import type { AttachmentItem, ChatMessage } from './data/types'
import { completeChat } from './openrouter'

export function ChatPage() {
  const [input, setInput] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [hasReceivedToken, setHasReceivedToken] = useState(false)
  const [error, setError] = useState<Error>()
  const requestController = useRef<AbortController | null>(null)

  const submit = (
    overrideText?: string,
    attachments: AttachmentItem[] = []
  ) => {
    const text = (overrideText ?? input).trim()
    if ((!text && attachments.length === 0) || busy) return
    setInput('')
    setError(undefined)

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

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      parts,
    }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setBusy(true)
    setHasReceivedToken(false)
    requestController.current = new AbortController()
    const assistantId = crypto.randomUUID()
    setMessages((current) => [
      ...current,
      {
        id: assistantId,
        role: 'assistant',
        parts: [{ type: 'text', text: '' }],
      },
    ])
    let streamedText = ''
    void completeChat(
      nextMessages,
      requestController.current.signal,
      (delta) => {
        setHasReceivedToken(true)
        streamedText += delta
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, parts: [{ type: 'text', text: streamedText }] }
              : message
          )
        )
      }
    )
      .catch((cause: unknown) => {
        setMessages((current) =>
          current.filter((message) => message.id !== assistantId)
        )
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(cause instanceof Error ? cause : new Error('聊天请求失败'))
      })
      .finally(() => setBusy(false))
  }

  const stop = () => {
    requestController.current?.abort()
    setBusy(false)
  }

  const handleRetry = () => {
    if (busy || messages.length === 0) return
    setError(undefined)

    setBusy(true)
    setHasReceivedToken(false)
    requestController.current = new AbortController()
    const assistantId = crypto.randomUUID()
    setMessages((current) => [
      ...current,
      {
        id: assistantId,
        role: 'assistant',
        parts: [{ type: 'text', text: '' }],
      },
    ])
    let streamedText = ''
    void completeChat(
      messages,
      requestController.current.signal,
      (delta) => {
        setHasReceivedToken(true)
        streamedText += delta
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, parts: [{ type: 'text', text: streamedText }] }
              : message
          )
        )
      }
    )
      .catch((cause: unknown) => {
        setMessages((current) =>
          current.filter((message) => message.id !== assistantId)
        )
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(cause instanceof Error ? cause : new Error('聊天请求失败'))
      })
      .finally(() => setBusy(false))
  }

  const handleNewChat = () => {
    requestController.current?.abort()
    setMessages([])
    setInput('')
    setError(undefined)
  }

  const handleResetChat = () => {
    requestController.current?.abort()
    setMessages([])
    setInput('')
    setError(undefined)
  }

  return (
    <PageLayout
      variant='fixed'
      fluid
      className='flex h-full min-h-0 flex-col p-0 rounded-[inherit]'
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
              isWaitingForResponse={busy && !hasReceivedToken}
              onApprove={() => undefined}
              onAnswer={() => undefined}
              onRetry={handleRetry}
              onDismissError={() => setError(undefined)}
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
