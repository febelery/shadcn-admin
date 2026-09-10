import { useEffect, useRef, useState } from 'react'
import { cn } from 'cn'
import {
  ArrowUp,
  Brain,
  FileArchive,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Plus,
  RotateCcw,
  Square,
  X,
} from 'lucide-react'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { AttachmentItem } from '../core/types'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (attachments?: AttachmentItem[]) => void
  onStop: () => void
  busy: boolean
  hasMessages: boolean
  onReset: () => void
  onNewChat: () => void
  deepThink?: boolean
  onDeepThinkChange?: (enabled: boolean) => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
    return <FileImage className='size-3.5 text-emerald-500' />
  }
  if (type.includes('pdf') || ext === 'pdf') {
    return <FileText className='size-3.5 text-red-500' />
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
    return <FileCode className='size-3.5 text-blue-500' />
  }
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
    return <FileArchive className='size-3.5 text-amber-500' />
  }
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return <FileSpreadsheet className='size-3.5 text-emerald-600' />
  }
  return <FileText className='text-primary size-3.5' />
}

/**
 * 底部悬浮输入卡片组件（ChatGPT / Claude / DeepSeek 经典悬浮胶囊风格）
 *
 * 深度集成 Attachment 附件渲染：
 * 1. 回形针选择或拖拽文件添加多模态附件；
 * 2. 在 Textarea 上方以 AttachmentGroup 横向滚动渲染预览卡片；
 * 3. 区分图片缩略图与各类文档专属图标；
 * 4. 包含独立的 AttachmentAction 移除按钮；
 * 5. 深度思考模式切换。
 */
export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
  hasMessages,
  onReset,
  onNewChat,
  deepThink,
  onDeepThinkChange,
}: ChatInputProps) {
  const [internalDeepThink, setInternalDeepThink] = useState(true)
  const isDeepThink = deepThink ?? internalDeepThink
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentsRef = useRef(attachments)

  useEffect(() => {
    attachmentsRef.current = attachments
  }, [attachments])

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((attachment) => {
        if (attachment.url?.startsWith('blob:'))
          URL.revokeObjectURL(attachment.url)
      })
    }
  }, [])

  const handleToggleDeepThink = () => {
    const next = !isDeepThink
    setInternalDeepThink(next)
    onDeepThinkChange?.(next)
  }

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const newItems: AttachmentItem[] = Array.from(fileList).map((file, idx) => {
      const isImage = file.type.startsWith('image/')
      return {
        id: `att-${Date.now()}-${idx}`,
        name: file.name,
        size: formatFileSize(file.size),
        mediaType: file.type || 'application/octet-stream',
        url: URL.createObjectURL(file),
        isImage,
      }
    })
    setAttachments((prev) => [...prev, ...newItems])
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const removed = prev.find((item) => item.id === id)
      if (removed?.url?.startsWith('blob:')) URL.revokeObjectURL(removed.url)
      return prev.filter((item) => item.id !== id)
    })
  }

  const handleSend = () => {
    if ((!value.trim() && attachments.length === 0) || busy) return
    onSubmit(attachments)
    setAttachments([])
  }

  return (
    <div className='from-background via-background/95 sticky bottom-0 z-10 w-full bg-gradient-to-t to-transparent px-4 pt-3 pb-4 sm:px-6 sm:pb-6'>
      <div className='mx-auto flex w-full max-w-3xl flex-col gap-2'>
        {/* 输入框胶囊卡片（支持拖拽文件放入） */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            addFiles(e.dataTransfer.files)
          }}
          className={cn(
            'bg-background/95 focus-within:border-ring/70 focus-within:ring-ring/20 rounded-2xl border p-2.5 shadow-lg shadow-black/5 backdrop-blur-md transition-all focus-within:ring-2 dark:shadow-black/25',
            isDragging && 'border-primary/70 ring-primary/20 ring-2'
          )}
        >
          {/* 隐藏的文件输入控件 */}
          <input
            ref={fileInputRef}
            type='file'
            multiple
            className='sr-only'
            onChange={(e) => {
              addFiles(e.target.files)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
          />

          {/* 待发送附件区域（类似 Claude / DeepSeek / Kimi 风格） */}
          {attachments.length > 0 && (
            <div className='border-border/40 mb-2 border-b px-1 pb-2.5'>
              <AttachmentGroup className='gap-2 py-0.5'>
                {attachments.map((file) => (
                  <Attachment
                    key={file.id}
                    size='xs'
                    orientation='horizontal'
                    className='bg-background/90 shadow-2xs'
                  >
                    <AttachmentMedia variant={file.isImage ? 'image' : 'icon'}>
                      {file.isImage && file.url ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className='size-full rounded-xs object-cover'
                        />
                      ) : (
                        <FileIconBadge
                          filename={file.name}
                          type={file.mediaType}
                        />
                      )}
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{file.name}</AttachmentTitle>
                      <AttachmentDescription>{file.size}</AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                      <AttachmentAction
                        aria-label={`移除 ${file.name}`}
                        onClick={() => removeAttachment(file.id)}
                        title='移除附件'
                      >
                        <X className='size-3' />
                      </AttachmentAction>
                    </AttachmentActions>
                  </Attachment>
                ))}
              </AttachmentGroup>
            </div>
          )}

          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder='输入消息向 AI 提问… '
            rows={1}
            className='placeholder:text-muted-foreground/60 max-h-36 min-h-[44px] resize-none border-0 bg-transparent px-2.5 py-1.5 text-sm leading-relaxed shadow-none outline-none focus-visible:ring-0'
          />

          <div className='border-border/40 mt-1 flex items-center justify-between border-t px-1 pt-1.5'>
            <div className='text-muted-foreground flex items-center gap-1.5'>
              <Button
                type='button'
                size='icon'
                variant='ghost'
                className='text-muted-foreground hover:text-foreground size-7 rounded-lg'
                aria-label='添加附件'
                title='上传图片或文件'
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className='size-3.5' />
              </Button>
              <button
                type='button'
                onClick={handleToggleDeepThink}
                aria-pressed={isDeepThink}
                title={
                  isDeepThink
                    ? '深度思考已开启 (点击关闭)'
                    : '深度思考已关闭 (点击开启)'
                }
                className={cn(
                  'inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all select-none',
                  isDeepThink
                    ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 shadow-2xs'
                    : 'border-border/60 bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted/70'
                )}
              >
                <Brain
                  className={cn(
                    'size-3 transition-transform',
                    isDeepThink && 'scale-105'
                  )}
                />
                <span>深度思考</span>
              </button>
              {hasMessages && (
                <>
                  <div className='bg-border/60 mx-0.5 h-3.5 w-px' />
                  <Button
                    type='button'
                    size='icon'
                    variant='ghost'
                    className='text-muted-foreground hover:text-foreground size-7 rounded-lg'
                    onClick={onReset}
                    title='重置到初始演示'
                    aria-label='重置演示'
                  >
                    <RotateCcw className='size-3.5' />
                  </Button>
                  <Button
                    type='button'
                    size='icon'
                    variant='ghost'
                    className='text-muted-foreground hover:text-foreground size-7 rounded-lg'
                    onClick={onNewChat}
                    title='开启新对话'
                    aria-label='开启新对话'
                  >
                    <Plus className='size-3.5' />
                  </Button>
                </>
              )}
            </div>

            <div className='flex items-center gap-1.5'>
              {busy ? (
                <Button
                  type='button'
                  size='icon'
                  variant='secondary'
                  onClick={onStop}
                  aria-label='停止生成'
                  className='size-8 rounded-full shadow-2xs'
                >
                  <Square className='size-3.5 fill-current' />
                </Button>
              ) : (
                <Button
                  type='button'
                  size='icon'
                  onClick={handleSend}
                  disabled={!value.trim() && attachments.length === 0}
                  aria-label='发送'
                  className='size-8 rounded-full shadow-2xs'
                >
                  <ArrowUp className='size-4' />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 底部免责声明 */}
        <p className='text-muted-foreground/60 text-center text-[11px]'>
          AI 生成内容仅供参考
        </p>
      </div>
    </div>
  )
}
