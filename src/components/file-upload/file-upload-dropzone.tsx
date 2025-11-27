/**
 * 文件上传区域
 */
import * as React from 'react'
import { CloudUpload } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useFileUploadContext } from './file-upload-context'
import { FileUploadItem } from './file-upload-item'
import { formatBytes } from './file-upload-utils'

interface FileUploadDropzoneProps extends React.ComponentProps<'div'> {
  children?: React.ReactNode
}

export function FileUploadDropzone({
  children,
  className,
  ...props
}: FileUploadDropzoneProps) {
  const {
    items,
    addFiles,
    disabled,
    view = 'list',
    cardSize = 'lg',
    validation,
  } = useFileUploadContext()
  const inputRef = React.useRef<HTMLInputElement>(null)

  // 处理禁用状态下的操作
  const handleDisabledAction = React.useCallback(() => {
    if (!disabled) return false

    // disabled 已经包含了 isMaxFilesReached 的判断（来自 use-file-upload.ts）
    const maxFiles = validation?.maxFiles
    if (maxFiles && items.length >= maxFiles) {
      toast.error(`已达上限（${items.length}/${maxFiles}）`)
    } else {
      toast.error('文件上传已禁用')
    }
    return true
  }, [disabled, validation?.maxFiles, items.length])

  const handleClick = React.useCallback(() => {
    if (handleDisabledAction()) return
    inputRef.current?.click()
  }, [handleDisabledAction])

  const handleFileChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (handleDisabledAction()) {
        e.target.value = ''
        return
      }

      const files = Array.from(e.target.files ?? [])
      if (files.length > 0) {
        addFiles(files)
      }
      // 重置input，允许重复选择同一文件
      e.target.value = ''
    },
    [handleDisabledAction, addFiles]
  )

  const handlePaste = React.useCallback(
    (e: React.ClipboardEvent) => {
      if (handleDisabledAction()) return

      const clipboardItems = Array.from(e.clipboardData.items)
      const files = clipboardItems
        .filter((item) => item.kind === 'file')
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null)

      if (files.length > 0) {
        addFiles(files)
      }
    },
    [handleDisabledAction, addFiles]
  )

  // 格式化 accept 文本（用于显示和 input accept 属性）
  const acceptText = React.useMemo(() => {
    if (!validation?.accept) return undefined
    return Array.isArray(validation.accept)
      ? validation.accept.join(', ')
      : validation.accept
  }, [validation])

  // 将 accept 文本转换为 input accept 属性格式（用逗号分隔，无空格）
  const inputAccept = React.useMemo(() => {
    if (!acceptText) return undefined
    return acceptText.replace(/,\s+/g, ',')
  }, [acceptText])

  // 生成空状态时的配置信息提示
  const configHints = React.useMemo(() => {
    if (items.length > 0) return []

    const hints: string[] = []

    if (acceptText) {
      hints.push(`类型: ${acceptText}`)
    }
    if (validation?.maxSize) {
      hints.push(`大小: ≤ ${formatBytes(validation.maxSize)}`)
    }
    if (validation?.minSize) {
      hints.push(`大小: ≥ ${formatBytes(validation.minSize)}`)
    }
    if (validation?.maxFiles) {
      hints.push(`数量: 最多 ${validation.maxFiles} 个`)
    }

    return hints
  }, [items.length, acceptText, validation])

  const dropzoneContent = (
    <div
      className={cn(
        'relative cursor-pointer rounded-lg border-2 border-dashed transition-all',
        'hover:border-primary/20 hover:bg-accent/30',
        'focus-within:border-primary focus-within:ring-primary/20 focus-within:ring-2',
        disabled
          ? 'border-muted bg-muted/30'
          : 'border-muted-foreground/25 bg-background',
        className
      )}
      onPaste={handlePaste}
      onClick={handleClick}
      {...props}
    >
      <input
        ref={inputRef}
        type='file'
        className='sr-only'
        disabled={disabled}
        multiple={validation?.maxFiles !== 1}
        accept={inputAccept}
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {items.length > 0 ? (
        // 显示文件列表/网格，空白区域可点击上传
        <div
          className={cn(
            'p-4',
            view === 'card' && 'grid gap-3',
            view === 'card' &&
              (cardSize === 'sm'
                ? 'grid-cols-[repeat(auto-fill,minmax(120px,1fr))]'
                : cardSize === 'lg'
                  ? 'grid-cols-[repeat(auto-fill,minmax(200px,1fr))]'
                  : 'grid-cols-1'),
            view === 'list' && 'flex flex-col gap-2'
          )}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className='animate-in fade-in slide-in-from-bottom-2'
              style={{
                animationDelay: `${index * 50}ms`,
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
        </div>
      ) : (
        // 显示上传提示
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-4 p-8 text-center',
            !disabled && 'cursor-pointer'
          )}
        >
          {children || (
            <>
              <div
                className={cn(
                  'rounded-full p-4 transition-all',
                  disabled
                    ? 'bg-muted'
                    : 'bg-primary/10 hover:bg-primary/15 hover:scale-105'
                )}
              >
                <CloudUpload
                  className={cn(
                    'size-8 transition-colors',
                    disabled ? 'text-muted-foreground' : 'text-primary'
                  )}
                />
              </div>
              <div className='space-y-2'>
                <p className='text-sm font-medium'>
                  <Button
                    type='button'
                    variant='link'
                    size='sm'
                    className='h-auto p-0'
                    disabled={disabled}
                  >
                    点击选择文件
                  </Button>
                </p>
                <p className='text-muted-foreground text-xs'>支持粘贴图片</p>
                {/* 空状态时的配置信息 */}
                {configHints.length > 0 && (
                  <div className='text-muted-foreground flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs'>
                    {configHints.map((hint, index) => (
                      <span
                        key={index}
                        className='bg-muted/50 rounded-md px-2 py-0.5'
                      >
                        {hint}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )

  return dropzoneContent
}
