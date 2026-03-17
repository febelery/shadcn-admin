/**
 * 文件列表项 / 卡片项
 */
import * as React from 'react'
import {
  XIcon,
  EyeIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  CropIcon,
} from 'lucide-react'
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
  const {
    removeFile,
    openPreview,
    cardSize = 'lg',
    setCropSource,
    crop,
  } = useFileUploadContext()

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    openPreview(item.id)
  }

  const handleCrop = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.file && item.file.type.startsWith('image/')) {
      if (item.url) {
        setCropSource({
          type: 'url',
          url: item.url,
          name: item.file.name,
          mimeType: item.file.type,
        })
      } else {
        setCropSource({ type: 'file', file: item.file })
      }
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeFile(item.id)
  }

  if (view === 'card') {
    return (
      <CardItem
        item={item}
        crop={crop}
        cardSize={cardSize}
        className={className}
        onPreview={handlePreview}
        onDelete={handleDelete}
        onCrop={handleCrop}
        {...props}
      />
    )
  }

  return (
    <ListItem
      item={item}
      crop={crop}
      className={className}
      onPreview={handlePreview}
      onDelete={handleDelete}
      onCrop={handleCrop}
      {...props}
    />
  )
}

function CardItem({
  item,
  crop,
  cardSize,
  className,
  onPreview,
  onDelete,
  onCrop,
  ...props
}: {
  item: FileItem
  crop?: boolean
  cardSize: 'sm' | 'lg' | 'full'
  onPreview: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
  onCrop: (e: React.MouseEvent) => void
} & React.ComponentProps<'div'>) {
  const isImage = item.file.type.startsWith('image/')

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
        'bg-muted/20 border-border/50 border shadow-sm transition-all duration-300',
        'hover:border-primary/30 hover:shadow-md',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
        item.status === 'error' &&
          'border-destructive/50 ring-destructive/20 ring-2',
        className
      )}
    >
      {/* 缩略图 */}
      <div className='relative size-full overflow-hidden'>
        <div className='size-full transition-transform duration-500 ease-out group-hover:scale-105'>
          <FileThumbnail
            file={item.file}
            url={item.url}
            view='card'
            className='size-full object-cover'
          />
        </div>
      </div>

      {item.status === 'success' && item.isNewUpload && (
        <div className='pointer-events-none absolute inset-0 animate-[flash-success_1.2s_ease-out_forwards] rounded-xl ring-1 ring-emerald-500/20 ring-inset' />
      )}

      {item.status === 'error' && item.isNewUpload && (
        <div className='pointer-events-none absolute inset-0 animate-[flash-error_1.2s_ease-out_forwards] rounded-xl' />
      )}

      {/* 上传进度条 */}
      {item.status === 'uploading' && (
        <div className='absolute inset-x-0 bottom-0'>
          <div className='bg-background/80 flex items-center justify-center py-1.5 backdrop-blur-md'>
            <span className='text-foreground font-mono text-[10px] font-bold'>
              {item.progress}%
            </span>
          </div>
          <div className='bg-muted relative h-1'>
            <div
              className='bg-primary absolute inset-y-0 left-0 transition-all duration-300 ease-out'
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 顶部悬浮操作栏 */}
      {item.status !== 'uploading' && (
        <div className='absolute top-2 right-2 z-20 flex -translate-y-1 gap-1.5 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100'>
          {crop && isImage && (
            <button
              type='button'
              onClick={onCrop}
              className={cn(
                'flex size-7 items-center justify-center rounded-full',
                'bg-background/80 text-foreground ring-border/50 shadow-sm ring-1 backdrop-blur-md',
                'hover:bg-muted transition-all hover:scale-105 active:scale-95'
              )}
              aria-label='裁切图片'
            >
              <CropIcon className='size-3.5' />
            </button>
          )}
          <button
            type='button'
            onClick={onDelete}
            className={cn(
              'flex size-7 items-center justify-center rounded-full',
              'bg-background/80 text-foreground ring-border/50 shadow-sm ring-1 backdrop-blur-md',
              'hover:bg-destructive hover:text-destructive-foreground transition-all hover:scale-105 active:scale-95'
            )}
            aria-label='删除文件'
          >
            <XIcon className='size-3.5' />
          </button>
        </div>
      )}

      {/* 底部信息层（使用更柔和的渐变底色） */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 translate-y-2',
          'bg-linear-to-t from-black/80 via-black/40 to-transparent',
          'opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100',
          item.status === 'uploading' && 'hidden',
          cardSize === 'sm' ? 'p-2 pt-6' : 'p-3 pt-8'
        )}
      >
        <p
          className={cn(
            'truncate leading-tight font-medium text-white drop-shadow-sm',
            cardSize === 'sm' ? 'text-[10px]' : 'text-xs'
          )}
        >
          {item.file.name}
        </p>
        {item.file.size > 0 && (
          <p
            className={cn(
              'mt-0.5 font-mono text-white/70',
              cardSize === 'sm' ? 'text-[9px]' : 'text-[10px]'
            )}
          >
            {formatBytes(item.file.size)}
          </p>
        )}
      </div>

      {/* 错误状态遮罩 */}
      {item.status === 'error' && (
        <>
          <div className='bg-destructive/10 pointer-events-none absolute inset-0 backdrop-blur-[1px]' />
          <div className='bg-destructive/95 pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-2 py-2 shadow-inner'>
            <AlertCircleIcon className='size-3.5 shrink-0 text-white' />
            <p className='truncate text-[10px] leading-tight font-semibold tracking-wide text-white'>
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
  crop,
  className,
  onPreview,
  onDelete,
  onCrop,
  ...props
}: {
  item: FileItem
  crop?: boolean
  onPreview: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
  onCrop: (e: React.MouseEvent) => void
} & React.ComponentProps<'div'>) {
  const [thumbError, setThumbError] = React.useState(false)
  const isImage = item.file.type.startsWith('image/')

  return (
    <div
      {...props}
      className={cn(
        'group bg-card border-border/50 flex items-center gap-3.5 rounded-xl border p-2.5 pr-4',
        'shadow-sm transition-all duration-200 ease-out',
        'hover:border-primary/30 hover:bg-muted/30 hover:shadow-md',
        item.status === 'error' &&
          'border-destructive/40 bg-destructive/5 hover:bg-destructive/10',
        className
      )}
    >
      {/* 缩略图容器 */}
      <div className='bg-muted/50 relative size-11 shrink-0 overflow-hidden rounded-lg border shadow-inner transition-transform group-hover:scale-105'>
        <FileThumbnail
          file={item.file}
          url={item.url}
          view='list'
          className='size-full object-cover'
          onLoadError={setThumbError}
        />
      </div>

      <div className='min-w-0 flex-1 py-0.5'>
        <div className='flex items-center gap-2.5'>
          <p className='text-foreground/90 min-w-0 truncate text-sm font-semibold'>
            {item.file.name}
          </p>
          <StatusBadge item={item} thumbError={thumbError} />
        </div>

        {item.status === 'uploading' ? (
          <div className='mt-2 flex items-center gap-2'>
            <Progress value={item.progress} className='h-1.5 flex-1' />
            <span className='text-muted-foreground font-mono text-[10px] font-medium'>
              {item.progress}%
            </span>
          </div>
        ) : (
          item.file.size > 0 && (
            <p className='text-muted-foreground mt-1 font-mono text-[11px]'>
              {formatBytes(item.file.size)}
            </p>
          )
        )}
      </div>

      {/* 操作按钮：使用位移动画让它们像抽屉一样滑出 */}
      <div className='flex shrink-0 translate-x-2 items-center gap-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100'>
        {crop && isImage && item.status !== 'uploading' && (
          <button
            type='button'
            onClick={onCrop}
            className='text-muted-foreground hover:bg-background hover:text-foreground hover:border-border flex size-8 items-center justify-center rounded-md border border-transparent shadow-none transition-all hover:shadow-sm'
            aria-label='裁切图片'
          >
            <CropIcon className='size-4' />
          </button>
        )}
        <button
          type='button'
          onClick={onPreview}
          className='text-muted-foreground hover:bg-background hover:text-foreground hover:border-border flex size-8 items-center justify-center rounded-md border border-transparent shadow-none transition-all hover:shadow-sm'
          aria-label='预览文件'
        >
          <EyeIcon className='size-4' />
        </button>
        <button
          type='button'
          onClick={onDelete}
          className='text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive/20 flex size-8 items-center justify-center rounded-md border border-transparent shadow-none transition-all hover:shadow-sm'
          aria-label='删除文件'
        >
          <XIcon className='size-4 transition-transform hover:rotate-90' />
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
      <span className='bg-primary/10 text-primary flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase'>
        Uploading
      </span>
    )
  }

  if (item.status === 'error' || thumbError) {
    return (
      <span className='bg-destructive/10 text-destructive flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold'>
        <AlertCircleIcon className='size-3' />
        {thumbError ? '加载失败' : (item.error ?? '上传失败')}
      </span>
    )
  }

  if (item.status === 'success' && item.isNewUpload) {
    return (
      <span className='flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'>
        <CheckCircle2Icon className='size-3' />
        已上传
      </span>
    )
  }

  return null
}
