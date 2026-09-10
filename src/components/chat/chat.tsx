import { useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import {
  lastAssistantMessageIsCompleteWithApprovalResponses,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai'
import { History, MessageCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MessageScroller } from '@/components/ui/chat'
import { ChatHistorySheet } from './chat-history-sheet'
import { ChatInput } from './chat-input'
import { ChatMessageList } from './chat-message-list'
import { useChatTransport } from './chat-provider'
import { createOpenRouterTransport, isOpenRouterConfigured } from './openrouter'
import { createDemoTransport } from './scripted-chat'
import { createSmoothTransport } from './smooth-stream'
import type { ChatTransport } from './transport'
import type { AttachmentItem, ChatMessage, MessageMetrics } from './types'

export interface ChatProps {
  className?: string
  mode?: 'page' | 'panel'
  historyMode?: 'sheet' | 'panel' | 'hidden'
  transport?: ChatTransport
  initialMessages?: ChatMessage[]
}

/**
 * 状态内聚且深层的对话模块（Deep Module）
 *
 * 彻底收拢自研状态机，完全委托给 @ai-sdk/react 的 useChat 生命周期：
 * 1. 原生接管流式分块累加与增量更新；
 * 2. 规范化 status 驱动加载与生成光标（submitted vs streaming）；
 * 3. 自动支持审批流与客户端工具回调（Human-in-the-loop）；
 * 4. 默认采用 @shadcn/helpers/ai-sdk 的本地模拟流，支持插拔后端 Transport。
 */
export function Chat({
  className,
  mode = 'page',
  historyMode,
  transport: propTransport,
  initialMessages,
}: ChatProps) {
  const contextTransport = useChatTransport()
  const defaultTransport = useMemo(
    () =>
      isOpenRouterConfigured()
        ? createOpenRouterTransport()
        : createDemoTransport(),
    []
  )
  const resolvedTransport = useMemo(() => {
    const raw = propTransport ?? contextTransport ?? defaultTransport
    return createSmoothTransport(raw)
  }, [propTransport, contextTransport, defaultTransport])

  const resolvedHistoryMode =
    historyMode ?? (mode === 'page' ? 'sheet' : 'hidden')
  const [input, setInput] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)

  // 性能指标状态与计时追踪
  const [metricsMap, setMetricsMap] = useState<Record<string, MessageMetrics>>(
    {}
  )
  const requestStartTimeRef = useRef<number>(0)
  const recordedTtftRef = useRef<Record<string, number>>({})
  const [thinkingStartTime, setThinkingStartTime] = useState<
    number | undefined
  >(undefined)

  const {
    messages,
    sendMessage,
    stop,
    status,
    error,
    clearError,
    regenerate,
    setMessages,
    addToolOutput,
    addToolApprovalResponse,
  } = useChat<ChatMessage>({
    messages: initialMessages,
    transport: resolvedTransport,
    throttle: 30,
    sendAutomaticallyWhen: (options) =>
      lastAssistantMessageIsCompleteWithToolCalls(options) ||
      lastAssistantMessageIsCompleteWithApprovalResponses(options),
  })

  const isBusy = status === 'submitted' || status === 'streaming'

  // 寻找最新一条助手消息 ID
  let lastAssistantId: string | undefined
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistantId = messages[i].id
      break
    }
  }

  // 只要处于请求中（无论是网络等待还是流式准备），在首个可见内容到来前，持续展示 Marker 正在思考占位
  const lastMessage = messages[messages.length - 1]
  const hasAssistantContent =
    lastMessage?.role === 'assistant' &&
    lastMessage.parts.some((part) => {
      if (part.type === 'text') return Boolean(part.text.trim())
      if (part.type === 'reasoning') return Boolean(part.text.trim())
      return true
    })

  const isWaitingForResponse = isBusy && !hasAssistantContent
  const isGenerating = isBusy && hasAssistantContent

  // 当助手输出首个 token / 内容时，精准捕获 TTFT (首字耗时)
  useEffect(() => {
    if (
      isBusy &&
      hasAssistantContent &&
      lastAssistantId &&
      !recordedTtftRef.current[lastAssistantId] &&
      requestStartTimeRef.current > 0
    ) {
      const ttft = Math.round(performance.now() - requestStartTimeRef.current)
      recordedTtftRef.current[lastAssistantId] = ttft
      setMetricsMap((prev) => ({
        ...prev,
        [lastAssistantId]: { ...prev[lastAssistantId], ttftMs: ttft },
      }))
    }
  }, [isBusy, hasAssistantContent, lastAssistantId])

  // 当生成完成（status 由 streaming 回归 ready）时，结算流式生成用时
  const prevStatusRef = useRef(status)
  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && status === 'ready') {
      setThinkingStartTime(undefined)
      if (lastAssistantId && requestStartTimeRef.current > 0) {
        const total = Math.round(
          performance.now() - requestStartTimeRef.current
        )
        const ttft = recordedTtftRef.current[lastAssistantId] ?? 0
        const duration = Math.max(0, total - ttft)
        setMetricsMap((prev) => ({
          ...prev,
          [lastAssistantId]: { ttftMs: ttft, durationMs: duration },
        }))
      }
    }
    prevStatusRef.current = status
  }, [status, lastAssistantId])

  const submit = (
    overrideText?: string,
    attachments: AttachmentItem[] = []
  ) => {
    const text = (overrideText ?? input).trim()
    if ((!text && attachments.length === 0) || isBusy) return
    setInput('')
    clearError()

    const now = performance.now()
    requestStartTimeRef.current = now
    setThinkingStartTime(now)

    const fileParts: ChatMessage['parts'] = attachments.map((att) => ({
      type: 'file',
      filename: att.name,
      mediaType: att.mediaType,
      url: att.url ?? '',
    }))

    if (fileParts.length > 0) {
      const parts: ChatMessage['parts'] = [...fileParts]
      if (text) {
        parts.push({ type: 'text', text })
      }
      void sendMessage({
        role: 'user',
        parts,
      })
    } else if (text) {
      void sendMessage({ text })
    }
  }

  const retry = () => {
    if (isBusy || messages.length === 0) return
    clearError()
    const now = performance.now()
    requestStartTimeRef.current = now
    setThinkingStartTime(now)
    if (lastAssistantId) {
      delete recordedTtftRef.current[lastAssistantId]
    }
    void regenerate()
  }

  const reset = () => {
    stop()
    setMessages([])
    setInput('')
    clearError()
    setMetricsMap({})
    recordedTtftRef.current = {}
    setThinkingStartTime(undefined)
  }

  return (
    <div className={cn('relative flex min-h-0 flex-1 flex-col', className)}>
      {resolvedHistoryMode !== 'hidden' && (
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
      )}

      <MessageScroller className='px-4 sm:px-6'>
        <div className='mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col'>
          <ChatMessageList
            messages={messages}
            error={error}
            onSelectPrompt={(prompt) => submit(prompt)}
            isWaitingForResponse={isWaitingForResponse}
            isGenerating={isGenerating}
            thinkingStartTime={thinkingStartTime}
            metricsMap={metricsMap}
            onApprove={(id, approved) =>
              addToolApprovalResponse({ id, approved })
            }
            onAnswer={(toolCallId, answers) =>
              addToolOutput({
                tool: 'askQuestions',
                toolCallId,
                output: { answers },
              })
            }
            onRetry={retry}
            onDismissError={clearError}
          />
        </div>
      </MessageScroller>

      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={(attachments) => submit(undefined, attachments)}
        onStop={stop}
        busy={isBusy}
        hasMessages={messages.length > 0}
        onReset={reset}
        onNewChat={reset}
      />

      {resolvedHistoryMode === 'sheet' && (
        <ChatHistorySheet open={historyOpen} onOpenChange={setHistoryOpen} />
      )}
      {resolvedHistoryMode === 'panel' && (
        <ChatHistorySheet
          mode='panel'
          open={historyOpen}
          onOpenChange={setHistoryOpen}
        />
      )}
    </div>
  )
}

export interface ChatLauncherProps {
  className?: string
  label?: string
  transport?: ChatTransport
}

/**
 * 紧凑型全局悬浮呼出挂件（可在任何路由页面中一行挂载）
 */
export function ChatLauncher({
  className,
  label = 'AI 助手',
  transport,
}: ChatLauncherProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className='fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6'>
      {open && (
        <div className='bg-background flex h-[min(680px,calc(100vh-6rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border shadow-2xl'>
          <div className='flex shrink-0 items-center justify-between border-b px-4 py-3'>
            <div className='flex items-center gap-2'>
              <div className='bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg'>
                <MessageCircle className='size-4' />
              </div>
              <div>
                <div className='text-sm font-semibold'>{label}</div>
                <div className='text-muted-foreground text-[11px]'>
                  随时为你提供帮助
                </div>
              </div>
            </div>
            <Button
              type='button'
              size='icon'
              variant='ghost'
              className='size-7 rounded-lg'
              onClick={() => setOpen(false)}
              aria-label='关闭 AI 助手'
            >
              <X className='size-4' />
            </Button>
          </div>
          <Chat mode='panel' historyMode='hidden' transport={transport} />
        </div>
      )}
      <Button
        type='button'
        size='icon'
        variant={open ? 'secondary' : 'default'}
        className={cn('size-14 rounded-full border shadow-lg', className)}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? `关闭 ${label}` : `打开 ${label}`}
        aria-expanded={open}
        title={label}
      >
        <MessageCircle className='size-6' />
      </Button>
    </div>
  )
}
