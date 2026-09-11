import { useEffect } from 'react'
import { useMessageScroller } from '@/components/ui/chat'
import type { ChatMessage, MessageMetrics } from '../core/types'
import { DEFAULT_TOOL_RENDERERS } from '../tools/registry'
import type { ChatToolRenderer, ToolPartContext } from '../tools/types'
import { ChatErrorCard } from './chat-error-card'
import { ChatMessageItem } from './chat-message-item'
import { ChatThinkingIndicator } from './chat-thinking-indicator'
import { ChatWelcome } from './chat-welcome'

export interface ChatMessageListProps {
  messages: ChatMessage[]
  error?: Error
  onSelectPrompt: (prompt: string) => void
  toolContext: ToolPartContext
  toolRenderers?: Record<string, ChatToolRenderer>
  isWaitingForResponse?: boolean
  isGenerating?: boolean
  onRetry?: () => void
  onDismissError?: () => void
  thinkingStartTime?: number
  metricsMap?: Record<string, MessageMetrics>
}

/**
 * 消息流主视图组件
 *
 * 职责分明：
 * 1. 自动平滑跟随滚动
 * 2. 空状态欢迎态（ChatWelcome）
 * 3. 消息列表遍历、基础消息渲染与统一工具分发（ChatMessageItem）
 * 4. 思考中等待态（ChatThinkingIndicator）
 * 5. 错误态卡片（ChatErrorCard）
 */
export function ChatMessageList({
  messages,
  error,
  onSelectPrompt,
  toolContext,
  toolRenderers = DEFAULT_TOOL_RENDERERS,
  isWaitingForResponse = false,
  isGenerating = false,
  onRetry,
  onDismissError,
  thinkingStartTime,
  metricsMap,
}: ChatMessageListProps) {
  const { scrollToEnd } = useMessageScroller()

  // 获取最新一条用户发送的消息 ID
  let lastUserMessageId: string | undefined
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      lastUserMessageId = messages[i].id
      break
    }
  }

  // 获取最新一条助手回复的消息 ID
  let lastAssistantMessageId: string | undefined
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistantMessageId = messages[i].id
      break
    }
  }

  // 当用户提交新问题（lastUserMessageId 改变）时，自动平滑滚动到底部
  useEffect(() => {
    if (!lastUserMessageId) return
    const rafId = requestAnimationFrame(() => {
      scrollToEnd({ behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(rafId)
  }, [lastUserMessageId, scrollToEnd])

  if (messages.length === 0) {
    return <ChatWelcome onSelectPrompt={onSelectPrompt} />
  }

  return (
    <div className='flex flex-col gap-6 pt-8 pb-6 sm:pt-10'>
      {messages.map((message) => (
        <ChatMessageItem
          key={message.id}
          message={message}
          metrics={metricsMap?.[message.id]}
          toolContext={toolContext}
          toolRenderers={toolRenderers}
          isLastAssistant={message.id === lastAssistantMessageId}
          isGenerating={isGenerating}
          onRetry={onRetry}
        />
      ))}

      {isWaitingForResponse && (
        <ChatThinkingIndicator startTime={thinkingStartTime} />
      )}

      {error && (
        <ChatErrorCard
          error={error}
          onRetry={onRetry}
          onDismiss={onDismissError}
        />
      )}
    </div>
  )
}
