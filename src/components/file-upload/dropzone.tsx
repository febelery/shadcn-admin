/**
 * 文件拖放上传区域
 */
import * as React from 'react'
import { CloudUploadIcon, UploadCloudIcon, PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { formatBytes } from '@/lib/file-utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useFileUploadContext } from './context'
import { FileUploadItem } from './item'

interface DropzoneProps extends React.ComponentProps<'div'> {
  children?: React.ReactNode
}

export function FileUploadDropzone({
  children,
  className,
  ...props
}: DropzoneProps) {
  const {
    items,
    addFiles,
    isDisabled,
    isAtMax,
    view = 'list',
    cardSize = 'lg',
    validation,
  } = useFileUploadContext()

  const inputRef = React.useRef<HTMLInputElement>(null)
  const dragCounter = React.useRef(0)
  const [isDragging, setIsDragging] = React.useState(false)

  const guardDisabled = React.useCallback(() => {
    if (!isDisabled) return false
    if (isAtMax && validation?.maxFiles) {
      toast.error(`已达上限（${items.length}/${validation.maxFiles}）`)
    } else {
      toast.error('文件上传已禁用')
    }
    return true
  }, [isDisabled, isAtMax, validation?.maxFiles, items.length])

  const openFilePicker = React.useCallback(() => {
    if (guardDisabled()) return
    inputRef.current?.click()
  }, [guardDisabled])

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length > 0) addFiles(files)
      e.target.value = ''
    },
    [addFiles]
  )

  const handlePaste = React.useCallback(
    (e: React.ClipboardEvent) => {
      if (guardDisabled()) return
      const files = Array.from(e.clipboardData.items)
        .filter((item) => item.kind === 'file')
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null)
      if (files.length > 0) addFiles(files)
    },
    [guardDisabled, addFiles]
  )

  const handleDragEnter = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounter.current++
      if (dragCounter.current === 1 && !isDisabled) setIsDragging(true)
    },
    [isDisabled]
  )

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }, [])

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounter.current = 0
      setIsDragging(false)
      if (guardDisabled()) return
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) addFiles(files)
    },
    [guardDisabled, addFiles]
  )

  const acceptStr = React.useMemo(() => {
    if (!validation?.accept) return undefined
    return Array.isArray(validation.accept)
      ? validation.accept.join(',')
      : validation.accept
  }, [validation?.accept])

  const hints = React.useMemo(() => {
    if (items.length > 0) return []
    const h: string[] = []
    if (acceptStr) h.push(acceptStr.replace(/,/g, ', '))
    if (validation?.maxSize) h.push(`≤ ${formatBytes(validation.maxSize)}`)
    if (validation?.maxFiles && validation.maxFiles > 1)
      h.push(`最多 ${validation.maxFiles} 个`)
    return h
  }, [items.length, acceptStr, validation])

  const isEmpty = items.length === 0

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 border-dashed transition-all duration-200',
        isDisabled
          ? 'border-muted bg-muted/20 cursor-not-allowed'
          : 'border-muted-foreground/20 bg-background hover:border-primary/30 hover:bg-accent/20 cursor-pointer',
        isDragging &&
          !isDisabled && [
            'border-primary bg-primary/5',
            'ring-primary/10 ring-4',
            'scale-[1.005]',
          ],
        'focus-within:border-primary/50 focus-within:ring-ring/20 focus-within:ring-2',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      onClick={openFilePicker}
      {...props}
    >
      <input
        ref={inputRef}
        type='file'
        className='sr-only'
        disabled={isDisabled}
        multiple={validation?.maxFiles !== 1}
        accept={acceptStr}
        onChange={handleInputChange}
        tabIndex={-1}
      />

      {/* ── 空状态 ── */}
      {isEmpty ? (
        <div className='flex flex-col items-center justify-center gap-4 px-6 py-12 text-center'>
          {children || (
            <>
              {/* 图标区域 */}
              <div
                className={cn(
                  'relative flex size-16 items-center justify-center rounded-2xl transition-all duration-300',
                  isDragging
                    ? 'bg-primary text-primary-foreground shadow-primary/25 scale-110 shadow-lg'
                    : isDisabled
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-muted/60 text-muted-foreground'
                )}
              >
                {isDragging ? (
                  <UploadCloudIcon className='size-8' />
                ) : (
                  <CloudUploadIcon className='size-8' />
                )}
              </div>

              {/* 文案 */}
              <div className='space-y-1.5'>
                {isDragging ? (
                  <p className='text-primary text-sm font-semibold'>
                    松开即可上传
                  </p>
                ) : (
                  <>
                    <p className='text-foreground text-sm font-medium'>
                      将文件拖到此处，或{' '}
                      <Button
                        type='button'
                        variant='link'
                        size='sm'
                        className='h-auto p-0 text-sm font-medium'
                        disabled={isDisabled}
                        onClick={(e) => {
                          e.stopPropagation()
                          openFilePicker()
                        }}
                      >
                        点击选择
                      </Button>
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      支持拖拽、点击、粘贴上传
                    </p>
                  </>
                )}
              </div>

              {/* 配置提示 */}
              {hints.length > 0 && (
                <div className='flex flex-wrap items-center justify-center gap-1.5'>
                  {hints.map((hint, i) => (
                    <span
                      key={i}
                      className='border-border/60 bg-muted/50 text-muted-foreground rounded-full border px-2.5 py-0.5 text-[11px]'
                    >
                      {hint}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* ── 有文件时的列表 / 网格 ── */
        <div
          className={cn(
            'p-3',
            view === 'card' && [
              'grid gap-3',
              cardSize === 'sm' &&
                'grid-cols-[repeat(auto-fill,minmax(100px,1fr))]',
              cardSize === 'lg' &&
                'grid-cols-[repeat(auto-fill,minmax(180px,1fr))]',
              cardSize === 'full' && 'grid-cols-1',
            ],
            view === 'list' && 'flex flex-col gap-2'
          )}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className='animate-in fade-in slide-in-from-bottom-1 duration-200'
              style={{
                animationDelay: `${index * 40}ms`,
                animationFillMode: 'both',
              }}
            >
              <FileUploadItem
                item={item}
                view={view}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ))}

          {/* 未达上限时的「继续添加」入口 */}
          {!isDisabled &&
            (view === 'list' ? (
              /* List 模式：一行文字按钮 */
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  openFilePicker()
                }}
                className={cn(
                  'group/add flex w-full items-center gap-2.5 rounded-lg border border-dashed',
                  'border-muted-foreground/20 text-muted-foreground px-3 py-2.5 text-xs',
                  'transition-all duration-150',
                  'hover:border-primary/40 hover:bg-primary/5 hover:text-primary'
                )}
              >
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-md',
                    'bg-muted/60 transition-colors',
                    'group-hover/add:bg-primary/10 group-hover/add:text-primary'
                  )}
                >
                  <PlusIcon className='size-3' />
                </span>
                继续添加文件
                {validation?.maxFiles && (
                  <span className='text-muted-foreground/60 ml-auto text-[11px] tabular-nums'>
                    {items.length}/{validation.maxFiles}
                  </span>
                )}
              </button>
            ) : (
              /* Card 模式：虚线卡片，与文件卡片等宽等高 */
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  openFilePicker()
                }}
                className={cn(
                  'group/add relative aspect-square w-full rounded-xl',
                  'border-muted-foreground/25 border border-dashed',
                  'flex flex-col items-center justify-center gap-1.5',
                  'transition-colors duration-150',
                  'hover:border-muted-foreground/40 hover:bg-muted/20'
                )}
                aria-label='添加文件'
              >
                <span
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl',
                    'bg-muted/60 transition-all duration-200',
                    'group-hover/add:bg-primary/10 group-hover/add:scale-105'
                  )}
                >
                  <PlusIcon className='text-muted-foreground group-hover/add:text-primary size-5 transition-colors' />
                </span>
                <span className='text-muted-foreground group-hover/add:text-primary text-[11px] font-medium transition-colors'>
                  添加文件
                </span>
                {validation?.maxFiles && (
                  <span className='text-muted-foreground/40 absolute right-2.5 bottom-2 text-[10px] tabular-nums'>
                    {items.length}/{validation.maxFiles}
                  </span>
                )}
              </button>
            ))}
        </div>
      )}

      {/* 拖拽时覆盖在文件列表上的高亮遮罩 */}
      {isDragging && !isEmpty && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl',
            'bg-primary/8 backdrop-blur-[2px]'
          )}
        >
          <div className='bg-primary/15 flex size-14 items-center justify-center rounded-2xl'>
            <UploadCloudIcon className='text-primary size-7 animate-bounce' />
          </div>
          <p className='text-primary text-sm font-semibold'>松开即可上传</p>
        </div>
      )}
    </div>
  )
}
