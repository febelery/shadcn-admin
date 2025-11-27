/**
 * 文件上传缩略图组件
 * 支持多种文件类型的缩略图展示
 */
import * as React from 'react'
import {
  FileIcon,
  FileTextIcon,
  ImageIcon,
  FileVideoIcon,
  FileAudioIcon,
  FileCodeIcon,
  FileArchiveIcon,
  FileCogIcon,
  FileSpreadsheetIcon,
  FileTypeIcon,
  PresentationIcon,
  Play,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { getFileIconType } from '@/lib/file-utils'
import { cn } from '@/lib/utils'

export type FileThumbnailView = 'card' | 'list'

export type FileThumbnailType =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'text'
  | 'code'
  | 'archive'
  | 'application'
  | 'file'

interface FileThumbnailProps {
  file: File
  url?: string // 服务器 URL（用于回显）
  view?: FileThumbnailView
  className?: string
  onLoadError?: (hasError: boolean) => void // 预览加载失败回调
}

function getFileThumbnailType(file: File): FileThumbnailType {
  return getFileIconType(file) as FileThumbnailType
}

function getFileIcon(type: FileThumbnailType, size: 'sm' | 'md' | 'lg' = 'md') {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-8',
  }
  const className = sizeClasses[size]

  switch (type) {
    case 'image':
      return <ImageIcon className={className} />
    case 'video':
      return <FileVideoIcon className={className} />
    case 'audio':
      return <FileAudioIcon className={className} />
    case 'pdf':
      return <FileTextIcon className={className} />
    case 'word':
      return <FileTypeIcon className={className} />
    case 'excel':
      return <FileSpreadsheetIcon className={className} />
    case 'powerpoint':
      return <PresentationIcon className={className} />
    case 'text':
      return <FileTextIcon className={className} />
    case 'code':
      return <FileCodeIcon className={className} />
    case 'archive':
      return <FileArchiveIcon className={className} />
    case 'application':
      return <FileCogIcon className={className} />
    default:
      return <FileIcon className={className} />
  }
}

function getFileTypeGradient(type: FileThumbnailType): string {
  switch (type) {
    case 'image':
      return 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10'
    case 'video':
      return 'bg-gradient-to-br from-purple-500/20 to-blue-500/20'
    case 'audio':
      return 'bg-gradient-to-br from-pink-500/20 to-rose-500/20'
    case 'pdf':
      return 'bg-gradient-to-br from-red-500/20 to-orange-500/20'
    case 'word':
      return 'bg-gradient-to-br from-blue-600/20 to-blue-500/20'
    case 'excel':
      return 'bg-gradient-to-br from-green-600/20 to-green-500/20'
    case 'powerpoint':
      return 'bg-gradient-to-br from-orange-600/20 to-orange-500/20'
    case 'text':
      return 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
    case 'code':
      return 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
    case 'archive':
      return 'bg-gradient-to-br from-orange-500/20 to-amber-500/20'
    case 'application':
      return 'bg-gradient-to-br from-gray-500/20 to-slate-500/20'
    default:
      return 'bg-gradient-to-br from-gray-400/20 to-gray-500/20'
  }
}

const preloadMedia = (url: string, type: 'image' | 'video') => {
  return new Promise<void>((resolve, reject) => {
    if (type === 'image') {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = url
    } else {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('视频加载失败'))
      video.src = url
    }
  })
}

/**
 * 管理预览 URL
 * 优先使用 blob URL 实现即时预览
 * 如果有服务器 URL，会在后台预加载，成功后无缝切换
 */
function usePreviewUrl(file: File, serverUrl?: string, type?: FileThumbnailType) {
  const [url, setUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    const isMedia = type === 'image' || type === 'video'
    const blob = URL.createObjectURL(file)

    // 如果不是媒体文件或没有服务器 URL，直接使用 blob
    if (!isMedia || !serverUrl) {
      setUrl(blob)
      return () => URL.revokeObjectURL(blob)
    }

    // 初始显示 blob
    setUrl(blob)

    // 预加载服务器 URL
    let active = true
    const preload = async () => {
      try {
        await preloadMedia(serverUrl, type as 'image' | 'video')
        if (active) {
          setUrl(serverUrl)
          // 切换成功后，blob 可以释放了（但在 effect cleanup 中也会释放，这里主要是为了尽早释放内存）
          // 注意：这里不手动 revoke，依赖 cleanup 统一处理，避免竞态
        }
      } catch (err) {
        console.error('Preload failed, sticking to blob url', err)
      }
    }

    preload()

    return () => {
      active = false
      URL.revokeObjectURL(blob)
    }
  }, [file, serverUrl, type])

  return url
}

/**
 * 管理媒体加载状态
 */
function useMediaState(
  previewUrl: string | null,
  onLoadError?: (hasError: boolean) => void
) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasError, setHasError] = React.useState(false)
  const mediaRef = React.useRef<HTMLImageElement | HTMLVideoElement | null>(
    null
  )

  // 当 URL 变化时重置状态
  React.useEffect(() => {
    if (previewUrl) {
      setIsLoading(true)
      setHasError(false)
    }
  }, [previewUrl])

  const handleLoad = React.useCallback(() => {
    setIsLoading(false)
    setHasError(false)
    onLoadError?.(false)
  }, [onLoadError])

  const handleError = React.useCallback(() => {
    setIsLoading(false)
    setHasError(true)
    onLoadError?.(true)
  }, [onLoadError])

  // 检查缓存/已加载状态
  React.useEffect(() => {
    if (!previewUrl || !mediaRef.current) return

    const element = mediaRef.current
    const isComplete =
      (element instanceof HTMLImageElement && element.complete) ||
      (element instanceof HTMLVideoElement && element.readyState >= 2)

    if (isComplete) {
      handleLoad()
    }
  }, [previewUrl, handleLoad])

  return {
    isLoading,
    hasError,
    mediaRef,
    handleLoad,
    handleError,
  }
}

const LoadingIndicator = ({ view }: { view: FileThumbnailView }) => {
  const iconSize = view === 'card' ? 'size-6' : 'size-4'
  return (
    <div className='bg-muted/50 pointer-events-none absolute inset-0 z-10 flex items-center justify-center'>
      <Loader2 className={cn('text-muted-foreground animate-spin', iconSize)} />
    </div>
  )
}

const ErrorFallback = ({
  view,
  type,
}: {
  view: FileThumbnailView
  type: FileThumbnailType
}) => {
  const iconSize = view === 'card' ? 'size-8' : 'size-4'
  const containerClass =
    view === 'card'
      ? 'absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none'
      : 'flex size-full items-center justify-center pointer-events-none'

  return (
    <div className={cn(containerClass, getFileTypeGradient(type))}>
      <AlertCircle className={cn('text-muted-foreground', iconSize)} />
      {view === 'card' && (
        <span className='text-muted-foreground text-xs'>加载失败</span>
      )}
    </div>
  )
}

const GenericPreview = ({
  type,
  view,
}: {
  type: FileThumbnailType
  view: FileThumbnailView
}) => {
  const iconSize = view === 'card' ? 'lg' : 'md'
  return (
    <div
      className={cn(
        'pointer-events-none flex size-full flex-col items-center justify-center gap-2',
        getFileTypeGradient(type)
      )}
    >
      {getFileIcon(type, iconSize)}
    </div>
  )
}

export function FileThumbnail({
  file,
  url,
  view = 'card',
  className,
  onLoadError,
}: FileThumbnailProps) {
  const thumbnailType = React.useMemo(() => getFileThumbnailType(file), [file])
  const isImage = thumbnailType === 'image'
  const isVideo = thumbnailType === 'video'
  const isMedia = isImage || isVideo

  const previewUrl = usePreviewUrl(file, url, thumbnailType)
  const { isLoading, hasError, mediaRef, handleLoad, handleError } =
    useMediaState(previewUrl, onLoadError)

  // 非媒体类型不需要加载状态，直接通知成功
  React.useEffect(() => {
    if (!isMedia) {
      onLoadError?.(false)
    }
  }, [isMedia, onLoadError])

  // 渲染媒体内容
  const renderMedia = () => {
    if (!previewUrl) return null

    const commonProps = {
      className: cn(
        'size-full object-cover transition-opacity duration-300 pointer-events-none',
        isLoading && 'opacity-0',
        hasError && 'hidden'
      ),
      onLoad: isImage ? handleLoad : undefined,
      onLoadedMetadata: isVideo ? handleLoad : undefined,
      onError: handleError,
    }

    return (
      <>
        {isLoading && <LoadingIndicator view={view} />}
        {isImage ? (
          <img
            ref={mediaRef as React.RefObject<HTMLImageElement>}
            src={previewUrl}
            alt={file.name}
            {...commonProps}
          />
        ) : (
          <>
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={previewUrl}
              muted
              playsInline
              preload='metadata'
              {...commonProps}
            />
            {!isLoading && !hasError && view === 'card' && (
              <div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20'>
                <div className='bg-background/80 rounded-full p-3 shadow-lg'>
                  <Play className='fill-foreground text-foreground size-6' />
                </div>
              </div>
            )}
          </>
        )}
        {hasError && <ErrorFallback view={view} type={thumbnailType} />}
      </>
    )
  }

  // Card View
  if (view === 'card') {
    return (
      <div
        className={cn(
          'pointer-events-none relative size-full overflow-hidden',
          className
        )}
      >
        {isMedia && previewUrl ? (
          <div className='pointer-events-none relative size-full'>
            {renderMedia()}
          </div>
        ) : (
          <GenericPreview type={thumbnailType} view={view} />
        )}
      </div>
    )
  }

  // List View
  return (
    <div
      className={cn(
        'pointer-events-none relative flex items-center justify-center',
        className
      )}
    >
      {isMedia && previewUrl ? (
        renderMedia()
      ) : (
        <GenericPreview type={thumbnailType} view={view} />
      )}
    </div>
  )
}

