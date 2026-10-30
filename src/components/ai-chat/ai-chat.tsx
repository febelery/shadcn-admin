import { useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import {
  lastAssistantMessageIsCompleteWithApprovalResponses,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai'
import { cn } from 'cn'
import { MessageCircle, RotateCwIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAIChatTransport } from './core/chat-provider'
import { useChatStore } from './core/chat-store'
import { openRouterTransport } from './core/openrouter'
import type { AIChatTransport } from './core/transport'
import type { AttachmentItem, ChatMessage, MessageMetrics } from './core/types'
import type { ChatToolRenderer, ToolPartContext } from './tools/types'
import { ChatEmpty, DEFAULT_SUGGESTIONS } from './ui/chat-empty'
import { ChatInput } from './ui/chat-input'
import { ChatMessageList } from './ui/chat-messages'

export interface AIChatProps {
  className?: string
  /** Session key shared by views that should show the same conversation. */
  sessionId?: string
  transport?: AIChatTransport
  initialMessages?: ChatMessage[]
  toolRenderers?: Record<string, ChatToolRenderer>
  suggestions?: string[]
  /** Renders a close button in the header; used by the floating launcher. */
  onClose?: () => void
  /** Controls rendering of the built-in header. Defaults to true if onClose is provided. */
  showHeader?: boolean
}

/**
 * 状态内聚且深层的对话模块（Deep Module / Facade）
 *
 * 顶层装配容器：连接 core/ 逻辑状态与 ui/ 视图层，
 * 彻底收拢状态机，完全委托给 @ai-sdk/react 的 useChat 生命周期：
 * 1. 原生接管流式分块累加与增量更新；
 * 2. 规范化 status 驱动加载与生成光标（submitted vs streaming）；
 * 3. 统一工具调用（Tool Calls）与敏感操作审批流（Human-in-the-loop）；
 * 4. 默认采用本地模拟流，支持插拔后端 Transport。
 */
function ChatView({
  className,
  sessionId = 'default',
  transport: propTransport,
  initialMessages,
  toolRenderers,
  suggestions = DEFAULT_SUGGESTIONS,
  onClose,
  showHeader = Boolean(onClose),
}: AIChatProps) {
  const contextTransport = useAIChatTransport()
  const resolvedTransport = useMemo(
    () => propTransport ?? contextTransport ?? openRouterTransport,
    [propTransport, contextTransport]
  )

  const session = useChatStore((state) => state.sessions[sessionId])
  const storedMessages = session?.messages ?? []
  const input = session?.input ?? ''
  const storedMetrics = session?.metrics ?? {}
  const setInputValue = useChatStore((state) => state.setInput)
  const setMessagesValue = useChatStore((state) => state.setMessages)
  const setMetricsValue = useChatStore((state) => state.setMetrics)
  const resetStore = useChatStore((state) => state.reset)
  const setInput = (value: string) => setInputValue(sessionId, value)

  // 性能指标状态与计时追踪
  const [metricsMap, setMetricsMap] =
    useState<Record<string, MessageMetrics>>(storedMetrics)
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
    messages: initialMessages ?? storedMessages,
    transport: resolvedTransport,
    throttle: 30,
    sendAutomaticallyWhen: (options) =>
      lastAssistantMessageIsCompleteWithToolCalls(options) ||
      lastAssistantMessageIsCompleteWithApprovalResponses(options),
  })

  useEffect(() => {
    setMessagesValue(sessionId, messages)
  }, [messages, sessionId, setMessagesValue])

  useEffect(() => {
    setMetricsValue(sessionId, metricsMap)
  }, [metricsMap, sessionId, setMetricsValue])

  const isBusy = status === 'submitted' || status === 'streaming'

  // 寻找最新一条助手消息 ID
  let lastAssistantId: string | undefined
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistantId = messages[i].id
      break
    }
  }

  // 只要处于请求中，在首个可见内容到来前，持续展示 Marker 正在思考占位
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
    resetStore(sessionId)
    setInput('')
    clearError()
    setMetricsMap({})
    recordedTtftRef.current = {}
    setThinkingStartTime(undefined)
  }

  // 统一的工具上下文，支持客户端所有交互式工具与审批动作
  const toolContext = useMemo<ToolPartContext>(
    () => ({
      addToolOutput: ({ tool, toolCallId, output }) =>
        addToolOutput({
          tool,
          toolCallId,
          output,
        } as Parameters<typeof addToolOutput>[0]),
      addToolApprovalResponse: ({ id, approved }) =>
        addToolApprovalResponse({ id, approved }),
      isGenerating,
      onRetry: retry,
    }),
    [addToolOutput, addToolApprovalResponse, isGenerating, retry]
  )

  return (
    <MessageScrollerProvider autoScroll>
      <div className={cn('flex min-h-0 flex-1 flex-col text-sm', className)}>
        {showHeader && (
          <div className='flex shrink-0 items-center justify-between gap-3 pb-3'>
            <div className='flex flex-col gap-0.5'>
              <h1 className='text-base font-semibold tracking-tight'>
                AI 助手
              </h1>
              <p className='text-muted-foreground text-xs'>
                让助手阅读代码、运行命令、做出修改
              </p>
            </div>
            <div className='flex items-center gap-1.5'>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label='重置对话'
                      onClick={reset}
                      disabled={isBusy}
                    />
                  }
                >
                  <RotateCwIcon />
                </TooltipTrigger>
                <TooltipContent>
                  <p>重置</p>
                </TooltipContent>
              </Tooltip>
              {onClose && (
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label='关闭 AI 助手'
                  onClick={onClose}
                >
                  <X />
                </Button>
              )}
            </div>
          </div>
        )}

        <div className='relative min-h-0 flex-1'>
          {messages.length === 0 ? (
            <div className='flex size-full items-center justify-center py-4'>
              <ChatEmpty />
            </div>
          ) : (
            <MessageScroller>
              <MessageScrollerViewport className='scroll-fade-t scroll-fade-b py-3'>
                <MessageScrollerContent aria-busy={isBusy}>
                  <ChatMessageList
                    messages={messages}
                    error={error}
                    isWaitingForResponse={isWaitingForResponse}
                    isGenerating={isGenerating}
                    thinkingStartTime={thinkingStartTime}
                    metricsMap={metricsMap}
                    toolContext={toolContext}
                    toolRenderers={toolRenderers}
                    onRetry={retry}
                    onDismissError={clearError}
                  />
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          )}
        </div>

        <div className='from-background via-background/95 relative shrink-0 bg-gradient-to-t to-transparent pt-3 pb-2'>
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={(attachments) => submit(undefined, attachments)}
            onStop={stop}
            busy={isBusy}
            suggestions={suggestions}
            onSelectSuggestion={(prompt) => submit(prompt)}
          />
        </div>
      </div>
    </MessageScrollerProvider>
  )
}

/** Mounts one AI SDK chat controller per session key. */
export function AIChat(props: AIChatProps) {
  return <ChatView key={props.sessionId ?? 'default'} {...props} />
}

export interface AIChatLauncherProps {
  className?: string
  label?: string
  transport?: AIChatTransport
}

/**
 * 紧凑型全局悬浮呼出挂件（可在任何路由页面中一行挂载）
 */
export function AIChatLauncher({
  className,
  label = 'AI 助手',
  transport,
}: AIChatLauncherProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className='fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6'>
      {open && (
        <div className='bg-background flex h-[min(680px,calc(100vh-6rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border shadow-2xl'>
          <AIChat
            transport={transport}
            onClose={() => setOpen(false)}
            className='p-4'
          />
        </div>
      )}
      <Button
        type='button'
        size='icon'
        variant={open ? 'secondary' : 'default'}
        className={cn('size-14 rounded-full', className)}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? `关闭 ${label}` : `打开 ${label}`}
        aria-expanded={open}
      >
        <MessageCircle />
      </Button>
    </div>
  )
}
