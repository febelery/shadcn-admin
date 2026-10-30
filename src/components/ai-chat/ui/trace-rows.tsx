import { useState } from 'react'
import { type DynamicToolUIPart, getToolName, type ToolUIPart } from 'ai'
import {
  ArrowUpRightIcon,
  CircleCheckIcon,
  GlobeIcon,
  LoaderCircleIcon,
  WrenchIcon,
} from 'lucide-react'
import { CodeBlock, CodeBlockContent } from '@/components/ui/code-block'
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/components/ui/trace'
import type { ChatPart } from '../tools/types'

export type AnyToolPart = ToolUIPart | DynamicToolUIPart

export function ReasoningRow({
  text,
  running,
  seconds,
}: {
  text: string
  running: boolean
  seconds?: number
}) {
  const [open, setOpen] = useState<boolean>()

  const line = (
    <TraceLine status={running ? 'running' : undefined}>
      <TraceIcon>
        {running ? (
          <LoaderCircleIcon className='animate-spin' />
        ) : (
          <CircleCheckIcon />
        )}
      </TraceIcon>
      <TraceTitle>{running ? '思考中' : '已思考'}</TraceTitle>
      {!running && seconds !== undefined && seconds > 0 && (
        <TraceDescription>{seconds}s</TraceDescription>
      )}
    </TraceLine>
  )

  if (text.length === 0) {
    return line
  }

  return (
    <TraceCollapsible open={open ?? running} onOpenChange={setOpen}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent className='whitespace-pre-wrap'>
        {text}
      </TraceCollapsibleContent>
    </TraceCollapsible>
  )
}

type SourcePart = Extract<ChatPart, { type: 'source-url' }>

export function SourcesRow({
  sources,
  running,
}: {
  sources: SourcePart[]
  running: boolean
}) {
  return (
    <TraceCollapsible>
      <TraceCollapsibleTrigger>
        <TraceLine status={running ? 'running' : undefined}>
          <TraceIcon>
            {running ? (
              <LoaderCircleIcon className='animate-spin' />
            ) : (
              <GlobeIcon />
            )}
          </TraceIcon>
          <TraceTitle>
            {running ? '正在引用' : '引用了'} {sources.length} 个来源
          </TraceTitle>
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <Trace>
          {sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target='_blank'
              rel='noreferrer'
            >
              <TraceLine>
                <TraceIcon>
                  <GlobeIcon />
                </TraceIcon>
                <TraceTitle>
                  {source.title ?? new URL(source.url).hostname}
                  <span className='sr-only'>（在新标签页打开）</span>
                </TraceTitle>
                <TraceIcon>
                  <ArrowUpRightIcon />
                </TraceIcon>
              </TraceLine>
            </a>
          ))}
        </Trace>
      </TraceCollapsibleContent>
    </TraceCollapsible>
  )
}

function formatToolOutput(value: unknown): string {
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

export function ToolRow({
  part,
  streaming,
  title,
}: {
  part: AnyToolPart
  streaming: boolean
  title?: string
}) {
  const name = title ?? getToolName(part)

  if (
    part.state === 'output-denied' ||
    (part.state === 'approval-responded' && !part.approval.approved)
  ) {
    return (
      <TraceLine>
        <TraceIcon>
          <WrenchIcon />
        </TraceIcon>
        <TraceTitle>已拒绝 {name}</TraceTitle>
      </TraceLine>
    )
  }

  if (part.state === 'output-available' || part.state === 'output-error') {
    const failed = part.state === 'output-error'

    return (
      <TraceCollapsible>
        <TraceCollapsibleTrigger>
          <TraceLine status={failed ? 'error' : undefined}>
            <TraceIcon>
              <WrenchIcon />
            </TraceIcon>
            <TraceTitle>
              {failed ? '执行失败' : '已执行'} {name}
            </TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <CodeBlock size='sm' variant={failed ? 'destructive' : 'default'}>
            <CodeBlockContent wrap className='max-h-64'>
              {failed ? part.errorText : formatToolOutput(part.output)}
            </CodeBlockContent>
          </CodeBlock>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    )
  }

  const running =
    streaming || (part.state === 'approval-responded' && part.approval.approved)
  // A client-side tool stays input-available until addToolOutput is called.
  const waiting = !running && part.state === 'input-available'

  return (
    <TraceLine status={running ? 'running' : waiting ? 'pending' : 'error'}>
      <TraceIcon>
        {running ? (
          <LoaderCircleIcon className='animate-spin' />
        ) : (
          <WrenchIcon />
        )}
      </TraceIcon>
      <TraceTitle>
        {running ? '正在执行' : waiting ? '等待执行' : '执行失败'} {name}
      </TraceTitle>
    </TraceLine>
  )
}
