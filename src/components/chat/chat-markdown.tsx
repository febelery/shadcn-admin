import { memo, useMemo, useState } from 'react'
import { Check, Copy, Terminal } from 'lucide-react'
import { Highlight, themes } from 'prism-react-renderer'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'

const REMARK_PLUGINS = [remarkGfm]

const MARKDOWN_COMPONENTS: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '')
    const raw = String(children).replace(/\n$/, '')
    const isBlock = Boolean(match) || raw.includes('\n')

    if (!isBlock) {
      return (
        <code
          className='bg-muted/80 text-foreground rounded-md px-1.5 py-0.5 font-mono text-[13px] font-medium'
          {...props}
        >
          {children}
        </code>
      )
    }

    return (
      <ChatCodeBlock language={match ? match[1] : undefined} value={raw} />
    )
  },
  table({ children }) {
    return (
      <div className='border-border/70 my-3 w-full overflow-x-auto rounded-xl border shadow-2xs'>
        <table className='w-full border-collapse text-left text-xs'>
          {children}
        </table>
      </div>
    )
  },
  thead({ children }) {
    return (
      <thead className='bg-muted/60 border-border/70 text-foreground border-b text-xs font-semibold'>
        {children}
      </thead>
    )
  },
  th({ children }) {
    return (
      <th className='border-border/40 px-3.5 py-2 font-medium last:border-r-0'>
        {children}
      </th>
    )
  },
  td({ children }) {
    return (
      <td className='border-border/40 text-muted-foreground border-t px-3.5 py-2 last:border-r-0'>
        {children}
      </td>
    )
  },
  tr({ children }) {
    return (
      <tr className='hover:bg-muted/20 transition-colors'>{children}</tr>
    )
  },
  a({ href, children }) {
    return (
      <a
        href={href}
        target='_blank'
        rel='noreferrer noopener'
        className='text-primary decoration-primary/40 hover:decoration-primary font-medium underline underline-offset-4 transition-colors'
      >
        {children}
      </a>
    )
  },
  ul({ children }) {
    return (
      <ul className='text-foreground/90 my-2.5 list-disc space-y-1 pl-6'>
        {children}
      </ul>
    )
  },
  ol({ children }) {
    return (
      <ol className='text-foreground/90 my-2.5 list-decimal space-y-1 pl-6'>
        {children}
      </ol>
    )
  },
  blockquote({ children }) {
    return (
      <blockquote className='border-border bg-muted/20 text-muted-foreground my-3 border-l-2 pl-4 italic'>
        {children}
      </blockquote>
    )
  },
  h1({ children }) {
    return (
      <h1 className='text-foreground mt-5 mb-2.5 text-lg font-bold tracking-tight'>
        {children}
      </h1>
    )
  },
  h2({ children }) {
    return (
      <h2 className='text-foreground mt-4 mb-2 text-base font-semibold tracking-tight'>
        {children}
      </h2>
    )
  },
  h3({ children }) {
    return (
      <h3 className='text-foreground mt-3 mb-1.5 text-sm font-semibold tracking-tight'>
        {children}
      </h3>
    )
  },
  p({ children }) {
    return (
      <p className='text-foreground/90 my-2.5 leading-7 first:mt-0 last:mb-0'>
        {children}
      </p>
    )
  },
}

export interface ChatMarkdownProps {
  /** Markdown 原文内容 */
  content: string
  /** 是否正在流式吐字中 */
  isStreaming?: boolean
  className?: string
}

/**
 * 语言别名规范化映射
 */
function normalizeLanguage(lang?: string): string {
  if (!lang) return 'text'
  const l = lang.toLowerCase()
  if (l === 'js') return 'javascript'
  if (l === 'ts') return 'typescript'
  if (l === 'golang') return 'go'
  if (l === 'py') return 'python'
  if (l === 'sh' || l === 'shell' || l === 'zsh') return 'bash'
  if (l === 'md') return 'markdown'
  if (l === 'yml') return 'yaml'
  return l
}

/**
 * 修复流式传输中未闭合的代码块标记（Deep Module 内部容错机制）
 *
 * 为什么这么做：
 * 大模型在逐字吐出 ```typescript 之后，若尚未吐出闭合的 ```，直接交给 CommonMark 解析器
 * 会将后续全部内容乃至兄弟节点误认为代码块，导致界面闪烁与排版错乱。
 * 在内存中动态检测并临时修补未闭合的代码 fence，彻底平滑流式输出。
 */
export function repairIncompleteMarkdown(text: string): string {
  if (!text) return ''
  let repaired = text

  // 自动闭合未闭合的代码块反引号 (```)
  const fenceMatches = repaired.match(/^[ \t]*```/gm)
  if (fenceMatches && fenceMatches.length % 2 !== 0) {
    repaired = `${repaired}\n\`\`\``
  }

  return repaired
}

interface ChatCodeBlockProps {
  language?: string
  value: string
}

/**
 * 增强型语法高亮代码块组件
 *
 * 封装能力：
 * 1. 顶部 Header 状态条（语言标识 + 终端图标）
 * 2. 一键复制代码到剪贴板，包含复制成功的 Check 反馈与 Toast 提示
 * 3. 基于 prism-react-renderer 的语法高亮，根据系统 dark/light 主题自动切换配色
 * 4. 独立横向平滑滚动容器
 */
export const ChatCodeBlock = memo(function ChatCodeBlock({
  language,
  value,
}: ChatCodeBlockProps) {
  const { resolvedTheme } = useTheme()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success('代码已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败，请手动选择复制')
    }
  }

  const normalizedLang = normalizeLanguage(language)
  const prismTheme = resolvedTheme === 'dark' ? themes.vsDark : themes.github

  return (
    <div className='border-border/70 bg-muted/40 my-3 overflow-hidden rounded-xl border font-mono text-xs shadow-2xs'>
      {/* 顶部 Header 工具条 */}
      <div className='border-border/60 bg-muted/70 text-muted-foreground flex items-center justify-between border-b px-3.5 py-1.5'>
        <div className='flex items-center gap-1.5 text-[11px] font-medium'>
          <Terminal className='text-muted-foreground/80 size-3.5' />
          <span className='lowercase'>{language || 'code'}</span>
        </div>
        <button
          type='button'
          onClick={handleCopy}
          className='hover:bg-background/80 hover:text-foreground flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors select-none'
          title='复制代码'
          aria-label='复制代码'
        >
          {copied ? (
            <>
              <Check className='size-3 text-emerald-500' />
              <span className='text-emerald-500'>已复制</span>
            </>
          ) : (
            <>
              <Copy className='size-3' />
              <span>复制</span>
            </>
          )}
        </button>
      </div>

      {/* 语法高亮正文区域 */}
      <Highlight theme={prismTheme} code={value} language={normalizedLang}>
        {({ className, tokens, getLineProps, getTokenProps }) => (
          <div
            className='selection:bg-primary/20 overflow-x-auto p-3.5 leading-relaxed'
            style={{ backgroundColor: 'transparent' }}
          >
            <pre
              className={cn(
                'm-0 bg-transparent p-0 font-mono text-xs leading-relaxed',
                className
              )}
              style={{ backgroundColor: 'transparent' }}
            >
              <code>
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </code>
            </pre>
          </div>
        )}
      </Highlight>
    </div>
  )
})

/**
 * 深度 Markdown 渲染模块（Deep Module）
 *
 * 极简外部接口（content + isStreaming），内部完整收敛：
 * - 流式未闭合标记自愈
 * - 代码块与行内代码区分，自动添加带复制功能的 Header
 * - 表格水平自适应滚动容器与边框规范
 * - 安全外链防护（noopener/noreferrer）
 * - 流式打字呼吸光标
 */
export const ChatMarkdown = memo(function ChatMarkdown({
  content,
  isStreaming = false,
  className,
}: ChatMarkdownProps) {
  const repairedContent = useMemo(() => {
    return isStreaming ? repairIncompleteMarkdown(content) : content
  }, [content, isStreaming])

  if (!content.trim()) {
    return null
  }

  return (
    <div
      className={cn('relative space-y-2 text-sm leading-relaxed', className)}
    >
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        components={MARKDOWN_COMPONENTS}
      >
        {repairedContent}
      </ReactMarkdown>
    </div>
  )
})
