/**
 * 文件缩略图组件
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
  AlertCircleIcon,
  Loader2Icon,
  PlayIcon,
} from 'lucide-react'
import { getFileIconType } from '@/lib/file-utils'
import { cn } from '@/lib/utils'

export type ThumbnailView = 'card' | 'list'

type FileKind =
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
  /** 服务端 URL（用于回显） */
  url?: string
  view?: ThumbnailView
  className?: string
  onLoadError?: (hasError: boolean) => void
}

function getKind(file: File): FileKind {
  return getFileIconType(file) as FileKind
}

function getKindIcon(kind: FileKind, size: 'sm' | 'md' | 'lg' = 'md') {
  const cls = { sm: 'size-3.5', md: 'size-5', lg: 'size-7' }[size]
  switch (kind) {
    case 'image':
      return <ImageIcon className={cls} />
    case 'video':
      return <FileVideoIcon className={cls} />
    case 'audio':
      return <FileAudioIcon className={cls} />
    case 'pdf':
      return <FileTextIcon className={cls} />
    case 'word':
      return <FileTypeIcon className={cls} />
    case 'excel':
      return <FileSpreadsheetIcon className={cls} />
    case 'powerpoint':
      return <PresentationIcon className={cls} />
    case 'text':
      return <FileTextIcon className={cls} />
    case 'code':
      return <FileCodeIcon className={cls} />
    case 'archive':
      return <FileArchiveIcon className={cls} />
    case 'application':
      return <FileCogIcon className={cls} />
    default:
      return <FileIcon className={cls} />
  }
}

function getKindBg(kind: FileKind): string {
  switch (kind) {
    case 'image':
      return 'from-sky-500/10 to-cyan-500/10 text-sky-600 dark:text-sky-400'
    case 'video':
      return 'from-violet-500/15 to-purple-500/15 text-violet-600 dark:text-violet-400'
    case 'audio':
      return 'from-rose-500/15 to-pink-500/15 text-rose-600 dark:text-rose-400'
    case 'pdf':
      return 'from-red-500/15 to-orange-500/15 text-red-600 dark:text-red-400'
    case 'word':
      return 'from-blue-600/15 to-blue-500/15 text-blue-600 dark:text-blue-400'
    case 'excel':
      return 'from-emerald-600/15 to-green-500/15 text-emerald-600 dark:text-emerald-400'
    case 'powerpoint':
      return 'from-orange-600/15 to-amber-500/15 text-orange-600 dark:text-orange-400'
    case 'text':
      return 'from-blue-400/10 to-cyan-400/10 text-blue-500 dark:text-blue-400'
    case 'code':
      return 'from-green-500/15 to-teal-500/15 text-green-600 dark:text-green-400'
    case 'archive':
      return 'from-amber-500/15 to-yellow-500/15 text-amber-600 dark:text-amber-400'
    default:
      return 'from-muted/60 to-muted/30 text-muted-foreground'
  }
}

/**
 * 从视频文件或 URL 中提取第一帧，返回 data URL
 *
 * 流程：
 * 1. File.size > 0 时创建临时 blob URL；否则直接用 serverUrl
 * 2. 离屏 <video> 监听 loadeddata → seek(0)
 * 3. seeked 事件触发后 canvas.drawImage → toDataURL
 * 4. blob URL 在提取完成后立即 revoke（不再持有）
 */
function useVideoFirstFrame(file: File, serverUrl?: string) {
  const [frameSrc, setFrameSrc] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    setFrameSrc(null)
    setIsLoading(true)
    setHasError(false)

    // 决定视频来源：优先用本地 blob（即时），回显则用 serverUrl
    let blobUrl: string | null = null
    let videoSrc: string | null = null

    if (file.size > 0) {
      blobUrl = URL.createObjectURL(file)
      videoSrc = blobUrl
    } else if (serverUrl) {
      videoSrc = serverUrl
    }

    if (!videoSrc) {
      setIsLoading(false)
      setHasError(true)
      return
    }

    let cancelled = false
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')

    video.src = videoSrc
    video.muted = true
    video.preload = 'metadata'
    // 跨域视频（serverUrl）需要 crossOrigin 才能 canvas.toDataURL
    if (!blobUrl) video.crossOrigin = 'anonymous'

    const cleanup = () => {
      video.removeEventListener('loadeddata', onLoadedData)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
      video.src = ''
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }

    const onSeeked = () => {
      if (cancelled) return
      try {
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('no canvas context')
        canvas.width = video.videoWidth || 320
        canvas.height = video.videoHeight || 240
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setFrameSrc(dataUrl)
        setIsLoading(false)
      } catch {
        setHasError(true)
        setIsLoading(false)
      } finally {
        cleanup()
      }
    }

    const onLoadedData = () => {
      // seek 到第 0 秒触发 seeked，规避直接在 loadeddata 里绘制时可能拿到空帧的问题
      video.currentTime = 0
    }

    const onError = () => {
      if (cancelled) return
      setHasError(true)
      setIsLoading(false)
      cleanup()
    }

    video.addEventListener('loadeddata', onLoadedData)
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('error', onError)

    return () => {
      cancelled = true
      cleanup()
    }
  }, [file, serverUrl])

  return { frameSrc, isLoading, hasError }
}

function useImagePreviewUrl(file: File, serverUrl?: string) {
  const [url, setUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    // 本地文件：先创建 blob 实现即时预览
    const blob = file.size > 0 ? URL.createObjectURL(file) : null
    setUrl(blob)

    // 若有服务端 URL，后台预加载成功后无缝切换
    if (serverUrl) {
      let active = true
      const img = new Image()
      img.onload = () => {
        if (active) setUrl(serverUrl)
      }
      img.src = serverUrl
      return () => {
        active = false
        if (blob) URL.revokeObjectURL(blob)
      }
    }

    return () => {
      if (blob) URL.revokeObjectURL(blob)
    }
  }, [file, serverUrl])

  return url
}

function GenericIcon({ kind, view }: { kind: FileKind; view: ThumbnailView }) {
  return (
    <div
      className={cn(
        'flex size-full items-center justify-center bg-linear-to-br',
        getKindBg(kind)
      )}
    >
      {getKindIcon(kind, view === 'card' ? 'lg' : 'md')}
    </div>
  )
}

function ImagePreview({
  src,
  alt,
  view,
  onLoad,
  onError,
}: {
  src: string
  alt: string
  view: ThumbnailView
  onLoad: () => void
  onError: () => void
}) {
  const [loading, setLoading] = React.useState(true)
  return (
    <>
      {loading && (
        <div className='bg-muted/40 absolute inset-0 flex items-center justify-center'>
          <Loader2Icon
            className={cn(
              'text-muted-foreground animate-spin',
              view === 'card' ? 'size-5' : 'size-3.5'
            )}
          />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          'size-full object-cover transition-opacity duration-200',
          loading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={() => {
          setLoading(false)
          onLoad()
        }}
        onError={() => {
          setLoading(false)
          onError()
        }}
      />
    </>
  )
}

/**
 * 视频封面：展示 canvas 提取的第一帧 data URL
 * 而非直接渲染 <video>，避免浏览器为每个缩略图保持解码器实例
 */
function VideoThumbnail({
  file,
  url,
  view,
  onLoad,
  onError,
}: {
  file: File
  url?: string
  view: ThumbnailView
  onLoad: () => void
  onError: () => void
}) {
  const { frameSrc, isLoading, hasError } = useVideoFirstFrame(file, url)

  React.useEffect(() => {
    if (hasError) onError()
  }, [hasError, onError])

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex size-full items-center justify-center bg-linear-to-br',
          getKindBg('video')
        )}
      >
        <Loader2Icon
          className={cn(
            'text-muted-foreground animate-spin',
            view === 'card' ? 'size-5' : 'size-3.5'
          )}
        />
      </div>
    )
  }

  if (hasError || !frameSrc) {
    return <GenericIcon kind='video' view={view} />
  }

  return (
    <>
      <img
        src={frameSrc}
        alt='视频封面'
        className='size-full object-cover'
        onLoad={onLoad}
      />
      {/* 播放角标 */}
      {view === 'card' && (
        <div className='absolute inset-0 flex items-center justify-center bg-black/25'>
          <div className='flex size-9 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur-sm'>
            <PlayIcon className='fill-foreground text-foreground ml-0.5 size-4' />
          </div>
        </div>
      )}
      {view === 'list' && (
        <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
          <PlayIcon className='size-3 fill-white text-white' />
        </div>
      )}
    </>
  )
}

function ErrorFallback({
  kind,
  view,
}: {
  kind: FileKind
  view: ThumbnailView
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 bg-linear-to-br',
        getKindBg(kind),
        'size-full'
      )}
    >
      <AlertCircleIcon
        className={cn(
          'text-muted-foreground',
          view === 'card' ? 'size-6' : 'size-4'
        )}
      />
      {view === 'card' && (
        <span className='text-muted-foreground text-[10px]'>加载失败</span>
      )}
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
  const kind = React.useMemo(() => getKind(file), [file])
  const isImage = kind === 'image'
  const isVideo = kind === 'video'
  const isMedia = isImage || isVideo

  const imageUrl = useImagePreviewUrl(
    file,
    isImage ? url : undefined // 只有图片才用图片预加载 hook
  )

  const [hasError, setHasError] = React.useState(false)

  const handleLoad = React.useCallback(() => {
    setHasError(false)
    onLoadError?.(false)
  }, [onLoadError])

  const handleError = React.useCallback(() => {
    setHasError(true)
    onLoadError?.(true)
  }, [onLoadError])

  React.useEffect(() => {
    if (!isMedia) onLoadError?.(false)
  }, [isMedia, onLoadError])

  const content = () => {
    if (hasError) return <ErrorFallback kind={kind} view={view} />

    if (isVideo) {
      return (
        <VideoThumbnail
          file={file}
          url={url}
          view={view}
          onLoad={handleLoad}
          onError={handleError}
        />
      )
    }

    if (isImage && imageUrl) {
      return (
        <ImagePreview
          src={imageUrl}
          alt={file.name}
          view={view}
          onLoad={handleLoad}
          onError={handleError}
        />
      )
    }

    return <GenericIcon kind={kind} view={view} />
  }

  return (
    <div className={cn('relative size-full overflow-hidden', className)}>
      {content()}
    </div>
  )
}
