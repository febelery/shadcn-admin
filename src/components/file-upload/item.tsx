/**
 * 文件列表项 / 卡片项
 *
 * 改进：
 * - Card 删除按钮：opacity + scale 过渡，替换 hidden/block 跳变
 * - Card 上传进度：底部进度条覆盖，比右上角转圈更优雅
 * - Card 状态 flash：isNewUpload 触发短暂颜色动画
 * - List 缩略图：固定宽高，不受文件名长度影响
 * - List 状态：badge 式标签，更醒目
 */
import * as React from 'react'
import { XIcon, EyeIcon, AlertCircleIcon, CheckCircle2Icon } from 'lucide-react'
import { formatBytes } from '@/lib/file-utils'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { useFileUploadContext } from './context'
import { FileThumbnail } from './thumbnail'
import type { FileItem } from './types'

interface FileUploadItemProps extends React.ComponentProps<'div'> {
  item: FileItem
  view?: 'list' | 'card'
}

export function FileUploadItem({
  item,
  view = 'list',
  className,
  ...props
}: FileUploadItemProps) {
  const { removeFile, openPreview, cardSize = 'lg' } = useFileUploadContext()

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    openPreview(item.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeFile(item.id)
  }

  if (view === 'card') {
    return (
      <CardItem
        item={item}
        cardSize={cardSize}
        className={className}
        onPreview={handlePreview}
        onDelete={handleDelete}
        {...props}
      />
    )
  }

  return (
    <ListItem
      item={item}
      className={className}
      onPreview={handlePreview}
      onDelete={handleDelete}
      {...props}
    />
  )
}

function CardItem({
  item,
  cardSize,
  className,
  onPreview,
  onDelete,
  ...props
}: {
  item: FileItem
  cardSize: 'sm' | 'lg' | 'full'
  onPreview: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
} & React.ComponentProps<'div'>) {
  return (
    <div
      {...props}
      role='button'
      tabIndex={0}
      onClick={onPreview}
      onKeyDown={(e) =>
        e.key === 'Enter' && onPreview(e as unknown as React.MouseEvent)
      }
      className={cn(
        'group relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl',
        'bg-muted/30 border shadow-sm transition-all duration-200',
        'hover:border-primary/40 hover:shadow-md',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
        item.status === 'error' &&
          'border-destructive ring-destructive/30 ring-1',
        className
      )}
    >
      {/* 缩略图 */}
      <FileThumbnail
        file={item.file}
        url={item.url}
        view='card'
        className='size-full'
      />

      {/* 新上传成功 flash */}
      {item.status === 'success' && item.isNewUpload && (
        <div className='pointer-events-none absolute inset-0 animate-[flash-success_1.2s_ease-out_forwards] rounded-xl' />
      )}

      {/* 新上传失败 flash */}
      {item.status === 'error' && item.isNewUpload && (
        <div className='pointer-events-none absolute inset-0 animate-[flash-error_1.2s_ease-out_forwards] rounded-xl' />
      )}

      {/* 上传进度条（底部） */}
      {item.status === 'uploading' && (
        <div className='absolute inset-x-0 bottom-0'>
          <div className='relative h-1.5 bg-black/20'>
            <div
              className='bg-primary absolute inset-y-0 left-0 transition-all duration-300 ease-out'
              style={{ width: `${item.progress}%` }}
            />
          </div>
          {/* 进度百分比 */}
          <div className='flex items-center justify-center bg-black/40 py-1 backdrop-blur-sm'>
            <span className='font-mono text-[10px] font-medium text-white'>
              {item.progress}%
            </span>
          </div>
        </div>
      )}

      {/* 删除按钮 — opacity 过渡，不用 hidden/block */}
      {item.status !== 'uploading' && (
        <button
          type='button'
          onClick={onDelete}
          className={cn(
            'absolute top-2 right-2 z-10',
            'flex size-6 items-center justify-center rounded-full',
            'bg-background/80 text-foreground/70 shadow-sm backdrop-blur-sm',
            'transition-all duration-150',
            'scale-90 opacity-0',
            'group-hover:scale-100 group-hover:opacity-100',
            'hover:bg-destructive hover:text-destructive-foreground',
            'focus-visible:ring-ring focus-visible:scale-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none'
          )}
          aria-label='删除文件'
        >
          <XIcon className='size-3' />
        </button>
      )}

      {/* 文件名 overlay（hover 时从底部滑入） */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 translate-y-full',
          'bg-linear-to-t from-black/70 via-black/40 to-transparent',
          'backdrop-blur-[2px] transition-transform duration-200',
          'group-hover:translate-y-0',
          item.status === 'uploading' && 'hidden', // 上传中由进度条占用底部
          cardSize === 'sm' ? 'p-2' : 'p-3'
        )}
      >
        <p
          className={cn(
            'truncate leading-tight font-medium text-white drop-shadow',
            cardSize === 'sm' ? 'text-[10px]' : 'text-xs'
          )}
        >
          {item.file.name}
        </p>
        {item.file.size > 0 && (
          <p
            className={cn(
              'text-white/70',
              cardSize === 'sm' ? 'text-[9px]' : 'text-[10px]'
            )}
          >
            {formatBytes(item.file.size)}
          </p>
        )}
      </div>

      {/* 错误状态：底部实色条 + 顶部半透明红色蒙版，无论图片什么颜色都清晰可读 */}
      {item.status === 'error' && (
        <>
          {/* 轻微红色蒙版，让图片整体显示"出了问题" */}
          <div className='bg-destructive/20 pointer-events-none absolute inset-0' />
          {/* 底部实色错误条：深色背景保证白色文字可读 */}
          <div className='bg-destructive/90 pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-2 py-1.5 backdrop-blur-sm'>
            <AlertCircleIcon className='size-3 shrink-0 text-white' />
            <p className='truncate text-[10px] leading-tight font-medium text-white'>
              {item.error ?? '上传失败'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function ListItem({
  item,
  className,
  onPreview,
  onDelete,
  ...props
}: {
  item: FileItem
  onPreview: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
} & React.ComponentProps<'div'>) {
  const [thumbError, setThumbError] = React.useState(false)

  return (
    <div
      {...props}
      className={cn(
        'group bg-card flex items-center gap-3 rounded-lg border p-3',
        'shadow-sm transition-all duration-150',
        'hover:border-primary/30 hover:shadow-md',
        item.status === 'error' && 'border-destructive/40 bg-destructive/5',
        className
      )}
    >
      {/* 缩略图容器 — 固定尺寸，不受文件名影响 */}
      <div className='bg-muted/50 relative size-10 shrink-0 overflow-hidden rounded-md border'>
        <FileThumbnail
          file={item.file}
          url={item.url}
          view='list'
          className='size-full'
          onLoadError={setThumbError}
        />
      </div>

      {/* 文件信息 */}
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-2'>
          <p className='min-w-0 flex-1 truncate text-sm leading-tight font-medium'>
            {item.file.name}
          </p>
          <StatusBadge item={item} thumbError={thumbError} />
        </div>

        {/* 文件大小 */}
        {item.file.size > 0 && (
          <p className='text-muted-foreground mt-0.5 text-xs'>
            {formatBytes(item.file.size)}
          </p>
        )}

        {/* 上传进度条 */}
        {item.status === 'uploading' && (
          <div className='mt-1.5'>
            <Progress value={item.progress} className='h-1' />
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className='flex shrink-0 items-center gap-0.5'>
        <button
          type='button'
          onClick={onPreview}
          onMouseDown={(e) => e.preventDefault()}
          tabIndex={-1}
          className={cn(
            'flex size-7 items-center justify-center rounded-md',
            'text-muted-foreground transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            'opacity-0 group-hover:opacity-100'
          )}
          aria-label='预览文件'
        >
          <EyeIcon className='size-3.5' />
        </button>
        <button
          type='button'
          onClick={onDelete}
          className={cn(
            'flex size-7 items-center justify-center rounded-md',
            'text-muted-foreground transition-all',
            'hover:bg-destructive/10 hover:text-destructive',
            'opacity-0 group-hover:opacity-100'
          )}
          aria-label='删除文件'
        >
          <XIcon className='group/del size-3.5 transition-transform hover:rotate-90' />
        </button>
      </div>
    </div>
  )
}

function StatusBadge({
  item,
  thumbError,
}: {
  item: FileItem
  thumbError: boolean
}) {
  if (item.status === 'uploading') {
    return (
      <span className='text-primary shrink-0 text-xs font-medium tabular-nums'>
        {item.progress}%
      </span>
    )
  }

  if (item.status === 'error' || thumbError) {
    return (
      <span className='text-destructive flex shrink-0 items-center gap-1 text-xs'>
        <AlertCircleIcon className='size-3' />
        {thumbError ? '加载失败' : (item.error ?? '上传失败')}
      </span>
    )
  }

  if (item.status === 'success' && item.isNewUpload) {
    return (
      <span className='flex shrink-0 items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400'>
        <CheckCircle2Icon className='size-3' />
        已上传
      </span>
    )
  }

  return null
}
