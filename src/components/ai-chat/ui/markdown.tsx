import type { ComponentProps } from 'react'
import {
  type ExtraProps,
  Streamdown,
  useIsCodeFenceIncomplete,
} from 'streamdown'
import { useHighlightedCode } from '@/hooks/use-highlighted-code'
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from '@/components/ui/code-block'

function MarkdownCodeBlock({
  code,
  language,
}: {
  code: string
  language: string
}) {
  const incomplete = useIsCodeFenceIncomplete()
  const lines = useHighlightedCode(code, language)

  return (
    <CodeBlock>
      <CodeBlockHeader>
        <CodeBlockTitle>{language || 'text'}</CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={code} disabled={incomplete} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent>
        {lines.map((line, index) => (
          <CodeBlockLine key={index}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  )
}

function MarkdownCode({
  node: _node,
  className,
  children,
  ...props
}: ComponentProps<'code'> & ExtraProps) {
  // Streamdown marks fenced code with data-block. Everything else is inline.
  if (!('data-block' in props)) {
    return (
      <code
        className='bg-muted rounded-sm px-1 py-0.5 font-mono text-[0.9em]'
        {...props}
      >
        {children}
      </code>
    )
  }

  return (
    <MarkdownCodeBlock
      code={typeof children === 'string' ? children : ''}
      language={/language-(\S+)/.exec(className ?? '')?.[1] ?? ''}
    />
  )
}

const components = { code: MarkdownCode }

export interface ChatMarkdownProps {
  children: string
  streaming?: boolean
}

export function ChatMarkdown({
  children,
  streaming = false,
}: ChatMarkdownProps) {
  return (
    <Streamdown
      controls={false}
      components={components}
      isAnimating={streaming}
      className='text-sm leading-relaxed'
    >
      {children}
    </Streamdown>
  )
}
