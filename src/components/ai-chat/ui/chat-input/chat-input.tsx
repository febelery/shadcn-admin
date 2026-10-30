import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useRef,
  useState,
} from 'react'
import { cn } from 'cn'
import { ArrowUpIcon, PaperclipIcon, SquareIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import { useFileUpload } from '@/components/file-upload'
import type { AttachmentItem } from '../../core/types'
import { ChatInputAttachments, fileItemToAttachment } from './chat-attachments'

export interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (attachments?: AttachmentItem[]) => void
  onStop: () => void
  busy: boolean
  suggestions: string[]
  onSelectSuggestion: (prompt: string) => void
}

const PASTE_LINE_THRESHOLD = 50
const PASTE_CHAR_THRESHOLD = 2000

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
  suggestions,
  onSelectSuggestion,
}: ChatInputProps) {
  const [isDragging, setIsDragging] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    items: attachmentItems,
    addFiles,
    removeFile,
    clearFiles,
  } = useFileUpload({})

  const canSend =
    (value.trim().length > 0 || attachmentItems.length > 0) && !busy

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSend) return
    onSubmit(attachmentItems.map(fileItemToAttachment))
    clearFiles()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return
    if (event.nativeEvent.isComposing) return
    event.preventDefault()
    formRef.current?.requestSubmit()
  }

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null)

    if (files.length > 0) {
      event.preventDefault()
      addFiles(files)
      return
    }

    const text = event.clipboardData.getData('text/plain')
    if (
      text.length > PASTE_CHAR_THRESHOLD ||
      text.split('\n').length > PASTE_LINE_THRESHOLD
    ) {
      event.preventDefault()
      addFiles([new File([text], 'pasted-text.txt', { type: 'text/plain' })])
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='scroll-fade-x flex scrollbar-none gap-2 overflow-x-auto overscroll-x-contain'>
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            variant='outline'
            size='sm'
            className='shrink-0'
            disabled={busy}
            onClick={() => onSelectSuggestion(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          if (event.dataTransfer.files.length > 0) {
            addFiles(Array.from(event.dataTransfer.files))
          }
        }}
      >
        <input
          ref={fileInputRef}
          type='file'
          multiple
          className='sr-only'
          tabIndex={-1}
          onChange={(event) => {
            if (event.target.files) addFiles(Array.from(event.target.files))
            event.target.value = ''
          }}
        />
        <InputGroup
          className={cn(
            'bg-background/90 backdrop-blur-md rounded-2xl border-border/80 shadow-xs transition-all focus-within:border-ring focus-within:shadow-md focus-within:ring-ring/30 focus-within:ring-3',
            isDragging && 'border-ring ring-ring/50 ring-3'
          )}
        >
          {attachmentItems.length > 0 && (
            <InputGroupAddon align='block-start'>
              <ChatInputAttachments
                items={attachmentItems}
                onRemove={removeFile}
              />
            </InputGroupAddon>
          )}
          <InputGroupTextarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder='输入消息，Enter 发送，Shift + Enter 换行'
            aria-label='消息'
            className='min-h-14'
          />
          <InputGroupAddon align='block-end' className='pt-1'>
            <InputGroupButton
              type='button'
              size='icon-sm'
              variant='outline'
              className='rounded-full'
              aria-label='添加附件'
              onClick={() => fileInputRef.current?.click()}
            >
              <PaperclipIcon />
            </InputGroupButton>
            {busy ? (
              <InputGroupButton
                type='button'
                size='icon-sm'
                variant='default'
                className='ml-auto rounded-full'
                aria-label='停止生成'
                onClick={onStop}
              >
                <SquareIcon className='fill-current' />
              </InputGroupButton>
            ) : (
              <InputGroupButton
                type='submit'
                size='icon-sm'
                variant='default'
                className='ml-auto rounded-full'
                disabled={!canSend}
                aria-label='发送'
              >
                <ArrowUpIcon />
              </InputGroupButton>
            )}
          </InputGroupAddon>
        </InputGroup>
      </form>
    </div>
  )
}
