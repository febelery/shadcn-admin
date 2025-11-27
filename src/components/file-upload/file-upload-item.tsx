import * as React from 'react'
import type { FileUploadItem as FileUploadItemType } from '@/types/file-upload'
import { X, Loader2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { useFileUploadContext } from './file-upload-context'
import { FileThumbnail } from './file-upload-thumbnail'

interface FileUploadItemProps extends React.ComponentProps<'div'> {
  item: FileUploadItemType
  view?: 'list' | 'card'
  showDelete?: boolean
  showProgress?: boolean
}

export function FileUploadItem({
  item,
  view = 'list',
  showDelete = true,
  showProgress = true,
  className,
  ...props
}: FileUploadItemProps) {
  const { removeFile, openPreview, cardSize = 'lg' } = useFileUploadContext()
  const [previewLoadError, setPreviewLoadError] = React.useState(false)

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
      <div
        {...props}
        className={cn(
          'group bg-card relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg border shadow-xs',
          'hover:border-primary/50 transition-all hover:shadow-md',
          item.status === 'error' && 'border-destructive',
          className
        )}
        onClick={(e) => {
          handlePreview(e)
          if (!e.defaultPrevented) {
            props.onClick?.(e)
          }
        }}
      >
        {/* 文件缩略图 */}
        <FileThumbnail
          file={item.file}
          url={item.url}
          view='card'
          className='size-full'
        />

        {/* 错误状态顶部渐变色条 */}
        {item.status === 'error' && item.isFromUpload && (
          <div className='from-destructive via-destructive/40 absolute inset-x-0 top-0 h-18 animate-[pulse_0.5s_ease-in-out_3_forwards] bg-linear-to-b to-transparent' />
        )}

        {/* 成功状态顶部渐变色条 */}
        {item.status === 'success' && item.isFromUpload && (
          <div className='absolute inset-x-0 top-0 h-18 animate-[pulse_0.5s_ease-in-out_3_forwards] bg-linear-to-b from-green-500 via-green-500/40 to-transparent' />
        )}

        {/* 上传进度指示器（右上角） */}
        {showProgress && item.status === 'uploading' && (
          <div className='absolute top-2 right-2 flex flex-col items-center gap-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'>
            <Loader2 className='size-4 animate-spin text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]' />
            <span className='text-xs font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'>
              {item.progress}%
            </span>
          </div>
        )}

        {/* 删除按钮（非上传中时显示） */}
        {showDelete && item.status !== 'uploading' && (
          <button
            type='button'
            onClick={handleDelete}
            className='bg-background/70 text-foreground/70 group-hover:animate-in group-hover:fade-in group-hover:zoom-in-95 hover:bg-accent absolute top-2 right-2 hidden rounded-full p-1.5 shadow-lg backdrop-blur-sm transition-all group-hover:block'
            aria-label='删除文件'
          >
            <X className='size-3.5 transition-all' />
          </button>
        )}

        {/* 文件名（悬停显示） */}
        <div
          className={cn(
            'from-background/60 via-background/40 absolute inset-x-0 bottom-0 hidden translate-y-full bg-linear-to-t to-transparent text-center backdrop-blur-md transition-all group-hover:block group-hover:translate-y-0',
            cardSize === 'sm' && 'p-1.5 text-[10px]',
            cardSize === 'lg' && 'p-2.5 text-xs',
            cardSize === 'full' && 'p-3 text-sm'
          )}
        >
          <div className='flex items-center gap-2'>
            <div className='min-w-0 flex-1'>
              <div className='text-foreground truncate font-medium'>
                {item.file.name}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 列表视图
  return (
    <div
      {...props}
      className={cn(
        'bg-card flex items-center gap-3 rounded-lg border p-3 shadow-xs',
        'hover:border-primary/50 transition-all hover:shadow-md',
        item.status === 'error' && 'border-destructive',
        className
      )}
    >
      {/* 图标/缩略图 */}
      <div className='bg-muted/50 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded border shadow-xs'>
        <FileThumbnail
          file={item.file}
          url={item.url}
          view='list'
          className='size-full'
          onLoadError={setPreviewLoadError}
        />
      </div>

      {/* 文件信息 */}
      <div className='min-w-0 flex-1'>
        <div className='truncate text-sm font-medium'>{item.file.name}</div>
        <div className='text-muted-foreground flex items-center gap-2 text-xs'>
          {item.status === 'uploading' && (
            <span className='text-primary'>{item.progress}%</span>
          )}
          {item.status === 'success' && !previewLoadError && (
            <span className='text-green-600'>上传完成</span>
          )}
          {(item.status === 'error' || previewLoadError) && (
            <span className='text-destructive'>
              {previewLoadError ? '加载失败' : item.error || '上传失败'}
            </span>
          )}
        </div>
        {/* 进度条 */}
        {showProgress && item.status === 'uploading' && (
          <div className='mt-1.5'>
            <Progress value={item.progress} />
          </div>
        )}
      </div>

      {/* 操作按钮组 */}
      <div className='flex shrink-0 items-center gap-1'>
        {/* 预览按钮 */}
        <button
          type='button'
          onClick={handlePreview}
          onMouseDown={(e) => e.preventDefault()}
          tabIndex={-1}
          className='text-muted-foreground hover:bg-accent hover:text-accent-foreground shrink-0 rounded-md p-1.5 transition-all'
          aria-label='预览文件'
        >
          <Eye className='size-4' />
        </button>

        {/* 删除按钮 */}
        {showDelete && (
          <button
            type='button'
            onClick={handleDelete}
            className='text-muted-foreground hover:bg-accent hover:text-destructive-foreground shrink-0 rounded-md p-1.5 transition-all'
            aria-label='删除文件'
          >
            <X className='size-4 transition-transform hover:rotate-90' />
          </button>
        )}
      </div>
    </div>
  )
}
