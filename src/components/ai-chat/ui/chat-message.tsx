import { memo, type ReactNode, useEffect, useState } from 'react'
import { isToolUIPart } from 'ai'
import { cn } from 'cn'
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  RefreshCcwIcon,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Button } from '@/components/ui/button'
import { Message, MessageContent, MessageFooter } from '@/components/ui/message'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Trace } from '@/components/ui/trace'
import type { ChatMessage, MessageMetrics } from '../core/types'
import { DEFAULT_TOOL_RENDERERS } from '../tools/registry'
import type {
  ChatPart,
  ChatToolRenderer,
  ToolPartContext,
} from '../tools/types'
import { ChatMarkdown } from './markdown'
import { MessageFileParts } from './message-attachments'
import { ReasoningRow, SourcesRow, ToolRow } from './trace-rows'

export interface ChatMessageItemProps {
  message: ChatMessage
  metrics?: MessageMetrics
  toolContext: ToolPartContext
  toolRenderers?: Record<string, ChatToolRenderer>
  isLastAssistant?: boolean
  streaming?: boolean
  onRetry?: () => void
}

function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

function MessageAction({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={label}
            {...props}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function CopyAction({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timeout)
  }, [copied])

  return (
    <MessageAction
      label={copied ? '已复制' : '复制'}
      onClick={() => {
        navigator.clipboard
          .writeText(value)
          .then(() => setCopied(true))
          .catch(() => {})
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </MessageAction>
  )
}

const LONG_TEXT_LINES = 10
const LONG_TEXT_CHARS = 500

function UserBubble({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong =
    text.split('\n').length > LONG_TEXT_LINES || text.length > LONG_TEXT_CHARS

  return (
    <Bubble align='end' variant='muted'>
      <BubbleContent className={cn('relative', isLong && 'pb-8')}>
        <motion.div
          initial={false}
          animate={{ height: isLong && !expanded ? 200 : 'auto' }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          className='overflow-hidden whitespace-pre-wrap'
        >
          {text}
        </motion.div>
        {isLong && (
          <>
            <div
              aria-hidden
              className={cn(
                'from-muted pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t to-transparent transition-opacity duration-200',
                expanded ? 'opacity-0' : 'opacity-100'
              )}
            />
            <Button
              variant='ghost'
              size='icon-xs'
              className='absolute right-1.5 bottom-1.5 z-10'
              aria-label={expanded ? '收起' : '展开全部'}
              aria-expanded={expanded}
              onClick={() => setExpanded((prev) => !prev)}
            >
              <ChevronDownIcon
                className={cn(
                  'transition-transform duration-200',
                  expanded && 'rotate-180'
                )}
              />
            </Button>
          </>
        )}
      </BubbleContent>
    </Bubble>
  )
}

type Segment =
  | { kind: 'trace'; steps: ReactNode[]; sources: SourcePart[] }
  | { kind: 'node'; node: ReactNode }

type SourcePart = Extract<ChatPart, { type: 'source-url' }>

// Consecutive reasoning / tool / source parts share one Trace so every step
// has the same shape. Text, files and interactive tool blocks break the run.
function groupParts(
  parts: ChatPart[],
  streaming: boolean,
  toolContext: ToolPartContext,
  toolRenderers: Record<string, ChatToolRenderer>,
  reasoningSeconds?: number
): Segment[] {
  const segments: Segment[] = []

  const trace = () => {
    const last = segments[segments.length - 1]
    if (last?.kind === 'trace') return last
    const next: Segment = { kind: 'trace', steps: [], sources: [] }
    segments.push(next)
    return next
  }

  parts.forEach((part, index) => {
    if (part.type === 'reasoning') {
      trace().steps.push(
        <ReasoningRow
          key={index}
          text={part.text}
          running={streaming && part.state === 'streaming'}
          seconds={reasoningSeconds}
        />
      )
      return
    }

    if (part.type === 'source-url') {
      const group = trace()
      if (!group.sources.some((source) => source.url === part.url)) {
        group.sources.push(part)
      }
      return
    }

    if (isToolUIPart(part)) {
      const block = toolRenderers[part.type]?.(part, toolContext)
      if (block) {
        segments.push({ kind: 'node', node: <div key={index}>{block}</div> })
        return
      }
      trace().steps.push(
        <ToolRow key={part.toolCallId} part={part} streaming={streaming} />
      )
      return
    }

    if (part.type === 'text') {
      if (!part.text.trim()) return
      segments.push({
        kind: 'node',
        node: (
          <ChatMarkdown key={index} streaming={streaming}>
            {part.text}
          </ChatMarkdown>
        ),
      })
      return
    }

    if (part.type === 'file') {
      segments.push({
        kind: 'node',
        node: <MessageFileParts key={index} parts={[part]} />,
      })
    }
  })

  return segments
}

export const ChatMessageItem = memo(function ChatMessageItem({
  message,
  metrics,
  toolContext,
  toolRenderers = DEFAULT_TOOL_RENDERERS,
  isLastAssistant = false,
  streaming = false,
  onRetry,
}: ChatMessageItemProps) {
  if (message.role === 'user') {
    const text = message.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n')
    const files = message.parts.filter((part) => part.type === 'file')

    return (
      <Message align='end'>
        <MessageContent>
          {files.length > 0 && <MessageFileParts parts={files} size='sm' />}
          {text && <UserBubble text={text} />}
        </MessageContent>
      </Message>
    )
  }

  const text = message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n\n')
  const hasText = text.trim().length > 0
  const reasoningSeconds = metrics?.ttftMs
    ? Math.round(metrics.ttftMs / 1000)
    : undefined
  const segments = groupParts(
    message.parts,
    streaming,
    toolContext,
    toolRenderers,
    reasoningSeconds
  )

  return (
    <Message>
      <MessageContent className='gap-3'>
        {segments.map((segment, index) => {
          if (segment.kind === 'node') return segment.node
          if (segment.steps.length === 0 && segment.sources.length === 0) {
            return null
          }
          return (
            <Trace key={index}>
              {segment.steps}
              {segment.sources.length > 0 && (
                <SourcesRow
                  sources={segment.sources}
                  running={streaming && !hasText}
                />
              )}
            </Trace>
          )
        })}
        {hasText && !streaming && (
          <MessageFooter className='gap-1 px-0'>
            <CopyAction value={text} />
            {isLastAssistant && onRetry && (
              <MessageAction label='重新生成' onClick={onRetry}>
                <RefreshCcwIcon />
              </MessageAction>
            )}
            {metrics?.ttftMs || metrics?.durationMs ? (
              <span className='text-muted-foreground/70 ml-1 font-mono text-[11px] tabular-nums'>
                {metrics.ttftMs ? `首字 ${formatDuration(metrics.ttftMs)}` : ''}
                {metrics.ttftMs && metrics.durationMs ? ' · ' : ''}
                {metrics.durationMs
                  ? `生成 ${formatDuration(metrics.durationMs)}`
                  : ''}
              </span>
            ) : null}
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  )
})
