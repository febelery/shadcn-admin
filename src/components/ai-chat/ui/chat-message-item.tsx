import { memo, useState } from 'react'
import { cn } from 'cn'
import {
  Brain,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  FileArchive,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  Globe,
  RotateCcw,
  Wrench,
} from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@/components/ui/attachment'
import type { ChatMessage, MessageMetrics } from '../core/types'
import { DEFAULT_TOOL_RENDERERS } from '../tools/registry'
import type { ChatToolRenderer, ToolPartContext } from '../tools/types'
import { ChatMarkdown } from './chat-markdown'

export interface ChatMessageItemProps {
  message: ChatMessage
  metrics?: MessageMetrics
  toolContext: ToolPartContext
  toolRenderers?: Record<string, ChatToolRenderer>
  isLastAssistant?: boolean
  isGenerating?: boolean
  onRetry?: () => void
}

function isImageMediaType(mediaType = '', filename = ''): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return (
    mediaType.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)
  )
}

function formatMediaType(mediaType = ''): string {
  if (mediaType.includes('pdf')) return 'PDF 文档'
  if (mediaType.includes('json')) return 'JSON 数据'
  if (mediaType.includes('text') || mediaType.includes('plain'))
    return '文本文档'
  if (mediaType.startsWith('image/')) return '图片文件'
  return mediaType || '文件附件'
}

function FileIconBadge({
  filename = '',
  type = '',
}: {
  filename?: string
  type?: string
}) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (
    type.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)
  ) {
    return <FileImage className='size-4 text-emerald-500' />
  }
  if (type.includes('pdf') || ext === 'pdf') {
    return <FileText className='size-4 text-red-500' />
  }
  if (
    [
      'ts',
      'tsx',
      'js',
      'jsx',
      'json',
      'py',
      'go',
      'rs',
      'html',
      'css',
      'sql',
    ].includes(ext)
  ) {
    return <FileCode className='size-4 text-blue-500' />
  }
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
    return <FileArchive className='size-4 text-amber-500' />
  }
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return <FileSpreadsheet className='size-4 text-emerald-600' />
  }
  return <FileText className='text-primary size-4' />
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  return `${(ms / 1000).toFixed(1)}s`
}

/**
 * 助手消息底部操作栏
 */
const AssistantMessageActions = memo(function AssistantMessageActions({
  content,
  isLast,
  metrics,
  onRetry,
}: {
  content: string
  isLast?: boolean
  metrics?: MessageMetrics
  onRetry?: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success('已复制助手回复')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败，请手动选择复制')
    }
  }

  const hasMetrics =
    Boolean(metrics?.ttftMs !== undefined && metrics.ttftMs > 0) ||
    Boolean(metrics?.durationMs !== undefined && metrics.durationMs > 0)

  return (
    <div className='text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5 pt-0.5 text-xs select-none'>
      {/* 快捷操作区 */}
      <div className='flex items-center gap-0.5'>
        <button
          type='button'
          onClick={handleCopy}
          className='hover:bg-muted/80 hover:text-foreground inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors'
          title='复制全文'
          aria-label='复制回复全文'
        >
          {copied ? (
            <>
              <Check className='size-3 text-emerald-500' />
              <span className='text-emerald-500'>已复制</span>
            </>
          ) : (
            <Copy className='size-3' />
          )}
        </button>

        {isLast && onRetry && (
          <button
            type='button'
            onClick={onRetry}
            className='hover:bg-muted/80 hover:text-foreground inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors'
            title='重新生成回复'
            aria-label='重新生成'
          >
            <RotateCcw className='size-3' />
          </button>
        )}
      </div>

      {/* 性能指标：首字耗时与流式生成耗时 */}
      {hasMetrics && (
        <div className='text-muted-foreground/60 flex items-center gap-1.5 font-mono text-[11px]'>
          <span className='text-muted-foreground/30'>|</span>
          {metrics?.ttftMs !== undefined && metrics.ttftMs > 0 && (
            <span>首字 {formatDuration(metrics.ttftMs)}</span>
          )}
          {metrics?.durationMs !== undefined &&
            metrics.durationMs > 0 &&
            metrics?.ttftMs !== undefined &&
            metrics.ttftMs > 0 && (
              <span className='text-muted-foreground/30'>·</span>
            )}
          {metrics?.durationMs !== undefined && metrics.durationMs > 0 && (
            <span>生成 {formatDuration(metrics.durationMs)}</span>
          )}
        </div>
      )}
    </div>
  )
})

/**
 * 深度思考折叠块
 */
const ReasoningBlock = memo(function ReasoningBlock({
  text,
  defaultOpen = true,
}: {
  text: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className='border-border/70 bg-muted/20 my-2 max-w-2xl overflow-hidden rounded-xl border text-xs'>
      <button
        type='button'
        onClick={() => setOpen((prev) => !prev)}
        className='text-muted-foreground hover:text-foreground flex w-full cursor-pointer items-center justify-between px-3.5 py-2 transition-colors select-none'
      >
        <div className='flex items-center gap-2 font-medium'>
          <Brain className='text-primary/80 size-3.5 animate-pulse' />
          <span>深度思考过程</span>
        </div>
        <div className='text-muted-foreground/70 flex items-center gap-1.5 text-[11px]'>
          <span>{open ? '收起' : '展开'}</span>
          <ChevronDown
            className={cn(
              'size-3.5 transition-transform duration-200',
              open ? 'rotate-180' : 'rotate-0'
            )}
          />
        </div>
      </button>
      {open && (
        <div className='border-border/40 bg-background/50 text-muted-foreground border-s-primary/50 border-s-2 border-t px-3.5 py-2.5 font-sans text-xs leading-relaxed whitespace-pre-wrap'>
          {text}
        </div>
      )}
    </div>
  )
})

/**
 * 用户消息气泡组件
 *
 * 优化点：
 * 1. 彻底移除外层 layout 属性，避免 FLIP 矩阵变形引起的边缘缩放抖动；
 * 2. 固定内边距，展开/收起过程中没有任何 DOM 增删或 padding 跳变；
 * 3. 按钮绝对定位固定在右下角，仅通过旋转图标指示折叠/展开状态，克制平滑；
 * 4. 遮罩层通过 opacity 纯 CSS 淡出，内容高度由 Motion 纯净过渡。
 */
const UserMessageBubble = memo(function UserMessageBubble({
  textParts,
}: {
  textParts: Array<{ text: string }>
}) {
  const [expanded, setExpanded] = useState(false)
  const fullText = textParts.map((p) => p.text).join('\n')
  const lineCount = fullText.split('\n').length
  // 超过 10 行或超过 500 个字符认定为超长消息，开启折叠
  const isLong = lineCount > 10 || fullText.length > 500

  return (
    <div
      className={cn(
        'bg-muted/80 text-foreground dark:bg-muted/50 relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words shadow-2xs sm:max-w-[75%]',
        isLong && 'pb-7'
      )}
    >
      <motion.div
        initial={false}
        animate={{ height: isLong && !expanded ? 200 : 'auto' }}
        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        className='overflow-hidden'
      >
        <div className='whitespace-pre-wrap'>{fullText}</div>
      </motion.div>

      {isLong && (
        <>
          {/* 折叠淡出遮罩：展开时平滑淡出，不遮挡操作 */}
          <div
            className={cn(
              'from-muted/95 via-muted/70 pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t to-transparent transition-opacity duration-200',
              expanded ? 'opacity-0' : 'opacity-100'
            )}
          />

          {/* 右下角固定控制按钮：原地旋转，无跳变 */}
          <button
            type='button'
            onClick={() => setExpanded((prev) => !prev)}
            className='text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 absolute right-2 bottom-1.5 z-10 inline-flex cursor-pointer items-center justify-center rounded-md p-1 transition-colors'
            title={expanded ? '收起' : '展开全部'}
            aria-label={expanded ? '收起' : '展开全部'}
          >
            <ChevronDown
              className={cn(
                'size-4 transition-transform duration-200',
                expanded && 'rotate-180'
              )}
            />
          </button>
        </>
      )}
    </div>
  )
})

/**
 * 单条消息基础渲染与工具分发
 */
export const ChatMessageItem = memo(function ChatMessageItem({
  message,
  metrics,
  toolContext,
  toolRenderers = DEFAULT_TOOL_RENDERERS,
  isLastAssistant = false,
  isGenerating = false,
  onRetry,
}: ChatMessageItemProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    const textParts = message.parts.filter((p) => p.type === 'text')
    const fileParts = message.parts.filter((p) => p.type === 'file')

    return (
      <div className='flex w-full flex-col items-end gap-2 py-1.5'>
        {/* 用户上传的附件胶囊流 */}
        {fileParts.length > 0 && (
          <div className='flex max-w-[85%] flex-wrap justify-end gap-2 sm:max-w-[75%]'>
            {fileParts.map((file, idx) => {
              const isImage = isImageMediaType(file.mediaType, file.filename)
              return (
                <Attachment
                  key={idx}
                  size='sm'
                  className='bg-background/90 shadow-2xs'
                >
                  <AttachmentMedia variant={isImage ? 'image' : 'icon'}>
                    {isImage && file.url ? (
                      <img
                        src={file.url}
                        alt={file.filename}
                        className='size-full rounded-xs object-cover'
                      />
                    ) : (
                      <FileIconBadge
                        filename={file.filename}
                        type={file.mediaType}
                      />
                    )}
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{file.filename}</AttachmentTitle>
                    <AttachmentDescription>
                      {formatMediaType(file.mediaType)}
                    </AttachmentDescription>
                  </AttachmentContent>
                  {file.url && (
                    <AttachmentTrigger
                      render={
                        <a
                          href={file.url}
                          download={file.filename}
                          target='_blank'
                          rel='noreferrer'
                          aria-label={`查看或下载 ${file.filename}`}
                        />
                      }
                    />
                  )}
                </Attachment>
              )
            })}
          </div>
        )}

        {/* 用户文本消息气泡（超长时自动折叠） */}
        {textParts.length > 0 && <UserMessageBubble textParts={textParts} />}
      </div>
    )
  }

  const fullAssistantText = message.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text)
    .join('\n\n')

  return (
    <div className='flex w-full flex-col py-2.5'>
      <div className='text-foreground w-full min-w-0 space-y-3 text-sm leading-relaxed'>
        {message.parts.map((part, index) => {
          // 统一 Tool 调用分发
          if (part.type.startsWith('tool-')) {
            const renderer = toolRenderers[part.type]
            if (renderer) {
              const rendered = renderer(part, toolContext)
              if (rendered) {
                return (
                  <span key={index} className='contents'>
                    {rendered}
                  </span>
                )
              }
            }
            // 未知工具或无渲染需求的状态降级展示
            return (
              <div
                key={index}
                className='text-muted-foreground/80 bg-muted/40 my-1.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px]'
              >
                <Wrench className='text-muted-foreground size-3' />
                <span>工具执行: {part.type.replace('tool-', '')}</span>
              </div>
            )
          }

          // 基础消息渲染
          if (part.type === 'text') {
            if (!part.text.trim()) return null
            return (
              <ChatMarkdown
                key={index}
                content={part.text}
                isStreaming={isLastAssistant && isGenerating}
              />
            )
          }

          if (part.type === 'reasoning') {
            return <ReasoningBlock key={index} text={part.text} />
          }

          if (part.type === 'file') {
            const isImage = isImageMediaType(part.mediaType, part.filename)
            return (
              <Attachment key={index} className='my-1 max-w-sm' size='default'>
                <AttachmentMedia variant={isImage ? 'image' : 'icon'}>
                  {isImage && part.url ? (
                    <img
                      src={part.url}
                      alt={part.filename}
                      className='size-full rounded-md object-cover'
                    />
                  ) : (
                    <FileIconBadge
                      filename={part.filename}
                      type={part.mediaType}
                    />
                  )}
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{part.filename}</AttachmentTitle>
                  <AttachmentDescription>
                    {formatMediaType(part.mediaType)}
                  </AttachmentDescription>
                </AttachmentContent>
                {part.url && (
                  <AttachmentTrigger
                    render={
                      <a
                        href={part.url}
                        download={part.filename}
                        target='_blank'
                        rel='noreferrer'
                        aria-label={`查看或下载 ${part.filename}`}
                      />
                    }
                  />
                )}
                <AttachmentActions>
                  <AttachmentAction
                    size='icon-xs'
                    aria-label={`下载 ${part.filename}`}
                    title='下载附件'
                    onClick={(e) => {
                      e.stopPropagation()
                      if (part.url) {
                        const link = document.createElement('a')
                        link.href = part.url
                        link.download = part.filename ?? 'download'
                        link.click()
                      }
                    }}
                  >
                    <Download className='size-3' />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            )
          }

          if (part.type === 'source-url') {
            return (
              <div key={index} className='flex flex-wrap gap-2 pt-1'>
                <a
                  href={part.url}
                  target='_blank'
                  rel='noreferrer'
                  className='hover:border-primary/40 hover:bg-accent/60 bg-card text-muted-foreground hover:text-foreground inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs shadow-2xs transition-colors'
                >
                  <Globe className='text-primary/70 size-3.5 shrink-0' />
                  <span className='max-w-[240px] truncate font-medium'>
                    {part.title ?? part.url}
                  </span>
                  <ExternalLink className='size-3 shrink-0 opacity-50' />
                </a>
              </div>
            )
          }

          return null
        })}
      </div>

      {/* 助手回复消息底部操作工具栏 */}
      {fullAssistantText.trim().length > 0 && !isGenerating && (
        <AssistantMessageActions
          content={fullAssistantText}
          isLast={isLastAssistant}
          metrics={metrics}
          onRetry={onRetry}
        />
      )}
    </div>
  )
})
