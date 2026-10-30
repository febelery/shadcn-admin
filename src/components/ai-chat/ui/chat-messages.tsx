import { useEffect, useState } from 'react'
import { AlertCircleIcon, RotateCwIcon, XIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'
import { MessageScrollerItem } from '@/components/ui/message-scroller'
import { Spinner } from '@/components/ui/spinner'
import type { ChatMessage, MessageMetrics } from '../core/types'
import { DEFAULT_TOOL_RENDERERS } from '../tools/registry'
import type { ChatToolRenderer, ToolPartContext } from '../tools/types'
import { ChatMessageItem } from './chat-message'

export interface ChatMessageListProps {
  messages: ChatMessage[]
  error?: Error
  toolContext: ToolPartContext
  toolRenderers?: Record<string, ChatToolRenderer>
  isWaitingForResponse?: boolean
  isGenerating?: boolean
  onRetry?: () => void
  onDismissError?: () => void
  thinkingStartTime?: number
  metricsMap?: Record<string, MessageMetrics>
}

function ThinkingMarker({ startTime }: { startTime?: number }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!startTime) return
    const update = () =>
      setSeconds(
        Math.max(0, Math.floor((performance.now() - startTime) / 1000))
      )
    update()
    const timer = setInterval(update, 500)
    return () => clearInterval(timer)
  }, [startTime])

  return (
    <Marker role='status'>
      <MarkerIcon>
        <Spinner />
      </MarkerIcon>
      <MarkerContent className='shimmer'>
        思考中 · <span className='tabular-nums'>{seconds}s</span>
      </MarkerContent>
    </Marker>
  )
}

export function ChatMessageList({
  messages,
  error,
  toolContext,
  toolRenderers = DEFAULT_TOOL_RENDERERS,
  isWaitingForResponse = false,
  isGenerating = false,
  onRetry,
  onDismissError,
  thinkingStartTime,
  metricsMap,
}: ChatMessageListProps) {
  let lastAssistantId: string | undefined
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistantId = messages[i].id
      break
    }
  }

  return (
    <>
      {messages.map((message) => (
        <MessageScrollerItem
          key={message.id}
          messageId={message.id}
          scrollAnchor={message.role === 'user'}
        >
          <ChatMessageItem
            message={message}
            metrics={metricsMap?.[message.id]}
            toolContext={toolContext}
            toolRenderers={toolRenderers}
            isLastAssistant={message.id === lastAssistantId}
            streaming={isGenerating && message.id === lastAssistantId}
            onRetry={onRetry}
          />
        </MessageScrollerItem>
      ))}

      {isWaitingForResponse && <ThinkingMarker startTime={thinkingStartTime} />}

      {error && (
        <Alert variant='destructive'>
          <AlertCircleIcon />
          <AlertTitle>生成回复时遇到问题</AlertTitle>
          <AlertDescription>
            <p className='break-words'>{error.message}</p>
            <div className='flex gap-2'>
              {onRetry && (
                <Button size='sm' variant='outline' onClick={onRetry}>
                  <RotateCwIcon data-icon='inline-start' />
                  重试
                </Button>
              )}
              {onDismissError && (
                <Button size='sm' variant='ghost' onClick={onDismissError}>
                  <XIcon data-icon='inline-start' />
                  忽略
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
