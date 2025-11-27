/**
 * 文件预览组件
 * 支持多种文件类型的预览和展示
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
import { cn } from '@/lib/utils'

export type FilePreviewView = 'card' | 'list'

export type FilePreviewType =
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

interface FilePreviewProps {
  file: File
  url?: string // 服务器 URL（用于回显）
  view?: FilePreviewView
  className?: string
  onLoadError?: (hasError: boolean) => void // 预览加载失败回调
}

/**
 * 从文件获取预览类型
 */
function getFilePreviewType(file: File): FilePreviewType {
  const type = file.type
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

  // 图片
  if (type.startsWith('image/')) return 'image'

  // 视频
  if (type.startsWith('video/')) return 'video'

  // 音频
  if (type.startsWith('audio/')) return 'audio'

  // PDF
  if (type === 'application/pdf' || extension === 'pdf') return 'pdf'

  // Word 文档
  if (
    type === 'application/msword' ||
    type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ['doc', 'docx'].includes(extension)
  )
    return 'word'

  // Excel 表格
  if (
    type === 'application/vnd.ms-excel' ||
    type ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    ['xls', 'xlsx', 'csv'].includes(extension)
  )
    return 'excel'

  // PowerPoint 演示文稿
  if (
    type === 'application/vnd.ms-powerpoint' ||
    type ===
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    ['ppt', 'pptx'].includes(extension)
  )
    return 'powerpoint'

  // 文本文件
  if (type.startsWith('text/') || ['txt', 'md', 'rtf'].includes(extension))
    return 'text'

  // 代码文件
  if (
    [
      'html',
      'css',
      'js',
      'jsx',
      'ts',
      'tsx',
      'json',
      'xml',
      'php',
      'py',
      'rb',
      'java',
      'c',
      'cpp',
      'cs',
      'go',
      'rs',
      'swift',
      'kt',
    ].includes(extension)
  )
    return 'code'

  // 压缩包
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension))
    return 'archive'

  // 应用程序
  if (
    ['exe', 'msi', 'app', 'apk', 'deb', 'rpm'].includes(extension) ||
    type.startsWith('application/')
  )
    return 'application'

  return 'file'
}

/**
 * 获取文件类型的图标
 */
function getFileIcon(type: FilePreviewType, size: 'sm' | 'md' | 'lg' = 'md') {
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

/**
 * 获取文件类型的渐变背景样式
 */
function getFileTypeGradient(type: FilePreviewType): string {
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

/**
 * 文件预览组件
 */
export function FilePreview({
  file,
  url,
  view = 'card',
  className,
  onLoadError,
}: FilePreviewProps) {
  const previewType = React.useMemo(() => getFilePreviewType(file), [file])
  const isImage = previewType === 'image'
  const isVideo = previewType === 'video'
  const isAudio = previewType === 'audio'

  // 预览 URL 管理
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null)
  const hasServerUrl = Boolean(
    url?.startsWith('http://') || url?.startsWith('https://')
  )

  // 加载和错误状态
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasError, setHasError] = React.useState(false)

  // 创建和管理 blob URL（仅用于图片和视频的本地预览）
  React.useEffect(() => {
    if (!isImage && !isVideo) return

    // 重置加载和错误状态
    setIsLoading(true)
    setHasError(false)

    // 如果有服务器 URL，清理 blob URL
    if (hasServerUrl) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
        setBlobUrl(null)
      }
      return
    }

    // 创建 blob 预览
    const blobUrlValue = URL.createObjectURL(file)
    setBlobUrl(blobUrlValue)

    return () => {
      URL.revokeObjectURL(blobUrlValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImage, isVideo, hasServerUrl, file, url])

  // 确定最终预览 URL
  const previewUrl = React.useMemo(() => {
    if (isImage || isVideo) {
      if (hasServerUrl && url) return url
      return blobUrl
    }
    return null
  }, [isImage, isVideo, hasServerUrl, url, blobUrl])

  // 当预览 URL 变化时，重置加载状态
  React.useEffect(() => {
    if (previewUrl) {
      setIsLoading(true)
      setHasError(false)
    }
  }, [previewUrl])

  // 统一的加载指示器
  const LoadingIndicator = React.useMemo(() => {
    if (!isLoading) return null
    const iconSize = view === 'card' ? 'size-6' : 'size-4'
    return (
      <div className='bg-muted/50 absolute inset-0 z-10 flex items-center justify-center'>
        <Loader2
          className={cn('text-muted-foreground animate-spin', iconSize)}
        />
      </div>
    )
  }, [isLoading, view])

  // 统一的错误回退显示
  const ErrorFallback = React.useMemo(() => {
    if (!hasError) return null
    const iconSize = view === 'card' ? 'size-8' : 'size-4'
    const containerClass =
      view === 'card'
        ? 'absolute inset-0 flex flex-col items-center justify-center gap-2'
        : 'flex size-full items-center justify-center'
    return (
      <div className={cn(containerClass, getFileTypeGradient(previewType))}>
        <AlertCircle className={cn('text-muted-foreground', iconSize)} />
        {view === 'card' && (
          <span className='text-muted-foreground text-xs'>加载失败</span>
        )}
      </div>
    )
  }, [hasError, view, previewType])

  // 统一的媒体元素加载处理
  const handleMediaLoad = React.useCallback(() => {
    setIsLoading(false)
    setHasError(false)
    onLoadError?.(false)
  }, [onLoadError])

  const handleMediaError = React.useCallback(() => {
    setIsLoading(false)
    setHasError(true)
    onLoadError?.(true)
  }, [onLoadError])

  // 当错误状态变化时，通知父组件
  React.useEffect(() => {
    if (!isImage && !isVideo) {
      // 非图片/视频类型，没有加载错误的概念
      onLoadError?.(false)
    }
  }, [isImage, isVideo, onLoadError])

  // 卡片视图
  if (view === 'card') {
    return (
      <div className={cn('relative size-full overflow-hidden', className)}>
        {/* 图片/视频预览 */}
        {(isImage || isVideo) && previewUrl && (
          <div className='relative size-full'>
            {LoadingIndicator}
            {isImage ? (
              <img
                src={previewUrl}
                alt={file.name}
                className={cn(
                  'size-full object-cover transition-opacity',
                  isLoading && 'opacity-0',
                  hasError && 'hidden'
                )}
                onLoad={handleMediaLoad}
                onError={handleMediaError}
              />
            ) : (
              <>
                <video
                  src={previewUrl}
                  className={cn(
                    'size-full object-cover transition-opacity',
                    isLoading && 'opacity-0',
                    hasError && 'hidden'
                  )}
                  muted
                  playsInline
                  preload='metadata'
                  onLoadedMetadata={handleMediaLoad}
                  onError={handleMediaError}
                />
                {!isLoading && !hasError && (
                  /* 播放按钮覆盖层 */
                  <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
                    <div className='bg-background/80 rounded-full p-3 shadow-lg'>
                      <Play className='fill-foreground text-foreground size-6' />
                    </div>
                  </div>
                )}
              </>
            )}
            {ErrorFallback}
          </div>
        )}

        {/* 音频预览 */}
        {isAudio && (
          <div
            className={cn(
              'flex size-full flex-col items-center justify-center gap-2',
              getFileTypeGradient(previewType)
            )}
          >
            {getFileIcon(previewType, 'lg')}
          </div>
        )}

        {/* 其他文件类型：图标 + 渐变背景 */}
        {!isImage && !isVideo && !isAudio && (
          <div
            className={cn(
              'flex size-full flex-col items-center justify-center gap-2',
              getFileTypeGradient(previewType)
            )}
          >
            {getFileIcon(previewType, 'lg')}
          </div>
        )}
      </div>
    )
  }

  // 列表视图
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* 图片/视频预览 */}
      {(isImage || isVideo) && previewUrl ? (
        <>
          {LoadingIndicator}
          {isImage ? (
            <img
              src={previewUrl}
              alt={file.name}
              className={cn(
                'size-full object-cover transition-opacity',
                isLoading && 'opacity-0',
                hasError && 'hidden'
              )}
              onLoad={handleMediaLoad}
              onError={handleMediaError}
            />
          ) : (
            <video
              src={previewUrl}
              className={cn(
                'size-full object-cover transition-opacity',
                isLoading && 'opacity-0',
                hasError && 'hidden'
              )}
              muted
              playsInline
              preload='metadata'
              onLoadedMetadata={handleMediaLoad}
              onError={handleMediaError}
            />
          )}
          {ErrorFallback}
        </>
      ) : (
        <div
          className={cn(
            'flex size-full items-center justify-center',
            getFileTypeGradient(previewType)
          )}
        >
          {getFileIcon(previewType, 'md')}
        </div>
      )}
    </div>
  )
}
