import { useRef, useState } from 'react'
import { EditorContent } from '@tiptap/react'
import { cn } from 'cn'
import {
  ArrowUp,
  Brain,
  Paperclip,
  Plus,
  RotateCcw,
  Square,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFileUpload } from '@/components/file-upload'
import type { AttachmentItem } from '../../core/types'
import { ChatInputAttachments, fileItemToAttachment } from './chat-attachments'
import { useChatEditor } from './use-chat-editor'

export interface ChatInputProps {
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

/**
 * 底部悬浮输入卡片组件（Pure Orchestration）
 *
 * 职责完全收拢于编排交互：
 * 1. 附件生命周期通过 useFileUpload 管理；
 * 2. 富文本与按键交互完全委托给 useChatEditor；
 * 3. 负责外层胶囊卡片布局、拖拽状态反馈与动作按钮调度。
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
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 待发送附件集合统一交给 useFileUpload 管理（纯本地预览模式）
  const {
    items: attachmentItems,
    addFiles,
    removeFile,
    clearFiles,
  } = useFileUpload({})

  const handleToggleDeepThink = () => {
    const next = !isDeepThink
    setInternalDeepThink(next)
    onDeepThinkChange?.(next)
  }

  // 真正的消息发送处理逻辑
  const handleSend = () => {
    if (editorHook.isComposingRef.current) return
    const text = editorHook.getEditorText().trim()
    if ((!text && attachmentItems.length === 0) || busy) return

    // 确保把最后提取的 Markdown 文本同步给外部
    onChange(editorHook.getEditorText())

    const attachments = attachmentItems.map(fileItemToAttachment)
    onSubmit(attachments)

    editorHook.clearContent()
    onChange('')
    clearFiles()
  }

  const editorHook = useChatEditor({
    value,
    onChange,
    onSend: handleSend,
    onAddFiles: addFiles,
  })

  const isInputEmpty = attachmentItems.length === 0 && editorHook.isEmpty

  return (
    <div className='from-background via-background/95 sticky bottom-0 z-10 w-full bg-gradient-to-t to-transparent px-4 pt-3 pb-4 sm:px-6 sm:pb-6'>
      <div className='mx-auto flex w-full max-w-3xl flex-col gap-2'>
        {/* 输入框胶囊卡片容器（支持拖拽文件放入） */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            if (e.dataTransfer.files.length > 0) {
              addFiles(Array.from(e.dataTransfer.files))
            }
          }}
          className={cn(
            'bg-background/95 focus-within:border-ring/70 focus-within:ring-ring/20 rounded-2xl border p-2.5 shadow-lg shadow-black/5 backdrop-blur-md transition-all focus-within:ring-2 dark:shadow-black/25',
            isDragging && 'border-primary/70 ring-primary/20 ring-2'
          )}
        >
          {/* 隐藏的系统文件选择器 */}
          <input
            ref={fileInputRef}
            type='file'
            multiple
            className='sr-only'
            onChange={(e) => {
              if (e.target.files) addFiles(Array.from(e.target.files))
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
          />

          {/* 待发送附件预览列表 */}
          <ChatInputAttachments items={attachmentItems} onRemove={removeFile} />

          {/* TipTap 富文本编辑区（点击空白区域自动聚焦） */}
          <div onClick={editorHook.focus} {...editorHook.compositionHandlers}>
            <EditorContent editor={editorHook.editor} />
          </div>

          {/* 工具与操作按钮工具栏 */}
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

            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground/50 hidden text-[11px] select-none sm:inline-block'>
                Enter 换行 · <kbd className='font-sans'>⌘/Ctrl</kbd>+↵ 发送
              </span>
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
                  disabled={isInputEmpty}
                  aria-label='发送'
                  title='发送消息 (⌘ + Enter / Ctrl + Enter)'
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
