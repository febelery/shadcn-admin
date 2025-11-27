import * as React from 'react'
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Download,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import * as ReactDOM from 'react-dom'
import { getFileIconType, getFileTypeFromUrl } from '@/lib/file-utils'
import { Button } from '@/components/ui/button'
import {
  MediaPlayer,
  MediaPlayerVideo,
  MediaPlayerAudio,
  MediaPlayerControls,
  MediaPlayerControlsOverlay,
  MediaPlayerPlay,
  MediaPlayerSeekBackward,
  MediaPlayerSeekForward,
  MediaPlayerSeek,
  MediaPlayerVolume,
  MediaPlayerTime,
  MediaPlayerFullscreen,
  MediaPlayerPlaybackSpeed,
  MediaPlayerPiP,
  MediaPlayerLoop,
} from '@/components/ui/media-player'

interface FilePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file?: File
  url?: string
  // 切换控制
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}

export function FilePreview({
  open,
  onOpenChange,
  file,
  url,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: FilePreviewProps) {
  const [scale, setScale] = React.useState(1)
  const [rotate, setRotate] = React.useState(0)

  React.useEffect(() => {
    if (open) {
      setScale(1)
      setRotate(0)
    }
  }, [open, file, url]) // file/url 变化时重置

  const fileType = React.useMemo(
    () => (file ? getFileIconType(file) : 'file'),
    [file]
  )

  const type = React.useMemo(
    () => (file ? fileType : url ? getFileTypeFromUrl(url) : 'file'),
    [file, fileType, url]
  )

  const previewUrl = React.useMemo(
    () => url || (file ? URL.createObjectURL(file) : ''),
    [url, file]
  )

  // 清理 blob url
  React.useEffect(() => {
    return () => {
      if (file && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [file, previewUrl])

  const handleClose = React.useCallback(
    () => onOpenChange(false),
    [onOpenChange]
  )

  // 键盘事件
  React.useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
      if (e.key === 'ArrowLeft' && hasPrev) {
        onPrev?.()
      }
      if (e.key === 'ArrowRight' && hasNext) {
        onNext?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleClose, hasPrev, hasNext, onPrev, onNext])

  // 图片控制按钮
  const zoomIn = React.useCallback(
    () => setScale((p) => Math.min(p + 0.5, 5)),
    []
  )
  const zoomOut = React.useCallback(
    () => setScale((p) => Math.max(p - 0.5, 0.5)),
    []
  )
  const rotateLeft = React.useCallback(() => setRotate((p) => p - 90), [])
  const rotateRight = React.useCallback(() => setRotate((p) => p + 90), [])
  const reset = React.useCallback(() => {
    setScale(1)
    setRotate(0)
  }, [])

  // 复制链接
  const [copied, setCopied] = React.useState(false)
  const handleCopyLink = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(previewUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败', err)
    }
  }, [previewUrl])

  // 下载文件
  const handleDownload = React.useCallback(() => {
    const link = document.createElement('a')
    link.href = previewUrl
    link.download = file?.name || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [previewUrl, file])

  if (!file && !url) return null

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div
          className='fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm'
          onClick={handleClose}
        >
          {/* 内容容器 */}
          <div
            className='relative flex h-[90vh] w-[90vw] items-center justify-center overflow-hidden rounded-lg'
            onClick={(e) => e.stopPropagation()}
          >
            {/* 切换按钮 - 左 */}
            {hasPrev && (
              <button
                type='button'
                className='absolute top-1/2 left-4 z-50 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white'
                onClick={(e) => {
                  e.stopPropagation()
                  onPrev?.()
                }}
              >
                <ChevronLeft className='size-8' />
              </button>
            )}

            {/* 切换按钮 - 右 */}
            {hasNext && (
              <button
                type='button'
                className='absolute top-1/2 right-4 z-50 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white'
                onClick={(e) => {
                  e.stopPropagation()
                  onNext?.()
                }}
              >
                <ChevronRight className='size-8' />
              </button>
            )}

            {/* 全局工具栏 */}
            <div
              className='absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/50 px-3 py-2 backdrop-blur-md'
              onClick={(e) => e.stopPropagation()}
            >
              {/* 全局按钮：下载 */}
              <ControlButton
                icon={Download}
                onClick={handleDownload}
                tooltip='下载'
              />
              {/* 全局按钮：复制链接 */}
              <ControlButton
                icon={copied ? Check : Copy}
                onClick={handleCopyLink}
                tooltip={copied ? '已复制' : '复制链接'}
              />
              {/* 图片特有控制按钮 */}
              {type === 'image' && (
                <>
                  <div className='mx-1 h-4 w-px bg-white/20' />
                  <ControlButton
                    icon={ZoomOut}
                    onClick={zoomOut}
                    tooltip='缩小'
                  />
                  <span className='w-12 text-center text-sm font-medium text-white'>
                    {Math.round(scale * 100)}%
                  </span>
                  <ControlButton
                    icon={ZoomIn}
                    onClick={zoomIn}
                    tooltip='放大'
                  />
                  <div className='mx-1 h-4 w-px bg-white/20' />
                  <ControlButton
                    icon={RotateCcw}
                    onClick={rotateLeft}
                    tooltip='向左旋转'
                  />
                  <ControlButton
                    icon={RotateCw}
                    onClick={rotateRight}
                    tooltip='向右旋转'
                  />
                  <div className='mx-1 h-4 w-px bg-white/20' />
                  <ControlButton
                    icon={RefreshCw}
                    onClick={reset}
                    tooltip='重置'
                  />
                </>
              )}
              {/* 全局按钮：关闭 */}
              <div className='mx-1 h-4 w-px bg-white/20' />
              <ControlButton icon={X} onClick={handleClose} tooltip='关闭' />
            </div>

            {/* 图片预览 */}
            {type === 'image' && (
              <div className='relative flex size-full items-center justify-center'>
                <img
                  src={previewUrl}
                  alt='preview'
                  className='max-h-full max-w-full object-contain transition-transform duration-200 ease-out'
                  style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                />
              </div>
            )}

            {/* 视频预览 */}
            {type === 'video' && (
              <div className='aspect-video w-full max-w-5xl overflow-hidden rounded-lg bg-black shadow-2xl'>
                <MediaPlayer title={file?.name || 'Video'}>
                  <MediaPlayerVideo
                    {...({
                      src: previewUrl,
                      className: 'max-h-[80vh]',
                    } as React.ComponentProps<'video'>)}
                  />
                  <MediaPlayerControls className='flex-col items-start gap-2.5'>
                    <MediaPlayerControlsOverlay />
                    <MediaPlayerSeek />
                    <div className='flex w-full items-center gap-2'>
                      <div className='flex flex-1 items-center gap-2'>
                        <MediaPlayerPlay />
                        <MediaPlayerSeekBackward />
                        <MediaPlayerSeekForward />
                        <MediaPlayerVolume expandable />
                        <MediaPlayerTime />
                      </div>
                      <div className='flex items-center gap-2'>
                        <MediaPlayerPlaybackSpeed />
                        <MediaPlayerPiP />
                        <MediaPlayerFullscreen />
                      </div>
                    </div>
                  </MediaPlayerControls>
                </MediaPlayer>
              </div>
            )}

            {/* 音频预览 */}
            {type === 'audio' && (
              <div className='w-full max-w-md rounded-xl shadow-2xl'>
                <MediaPlayer className='h-20'>
                  <MediaPlayerAudio
                    {...({
                      src: previewUrl,
                      className: 'sr-only',
                    } as React.ComponentProps<'audio'>)}
                  />
                  <MediaPlayerControls className='flex-col items-start gap-2.5'>
                    <MediaPlayerSeek withTime />
                    <div className='flex w-full items-center justify-center gap-2'>
                      <MediaPlayerSeekBackward />
                      <MediaPlayerPlay />
                      <MediaPlayerSeekForward />
                      <MediaPlayerVolume />
                      <MediaPlayerPlaybackSpeed />
                      <MediaPlayerLoop />
                    </div>
                  </MediaPlayerControls>
                </MediaPlayer>
              </div>
            )}

            {/* Office 预览 (Iframe) */}
            {(type === 'excel' ||
              type === 'word' ||
              type === 'powerpoint' ||
              type === 'pdf') && (
              <div className='size-full overflow-hidden rounded-lg bg-white'>
                {type === 'pdf' ? (
                  <iframe
                    src={previewUrl}
                    className='size-full'
                    title='PDF Preview'
                  />
                ) : (
                  <iframe
                    src={`https://ranuts.github.io/document/?locale=zh&src=${encodeURIComponent(previewUrl)}`}
                    className='size-full'
                    title='Office Preview'
                  />
                )}
              </div>
            )}

            {/* 默认 */}
            {['code', 'archive', 'application', 'text', 'file'].includes(
              type
            ) && (
              <div className='bg-background flex flex-col items-center justify-center gap-4 rounded-lg p-12 text-center shadow-xl'>
                <div className='bg-muted rounded-full p-6'>
                  <Download className='text-muted-foreground size-12' />
                </div>
                <div className='space-y-2'>
                  <h3 className='text-lg font-medium'>无法预览此文件</h3>
                  <p className='text-muted-foreground text-sm'>
                    此文件类型 ({type}) 暂不支持在线预览
                  </p>
                </div>
                <Button onClick={() => window.open(previewUrl, '_blank')}>
                  下载/打开文件
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  )

  return ReactDOM.createPortal(modalContent, document.body)
}

function ControlButton({
  icon: Icon,
  onClick,
  tooltip,
}: {
  icon: any
  onClick: () => void
  tooltip: string
}) {
  return (
    <button
      type='button'
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className='rounded-full p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white'
      title={tooltip}
    >
      <Icon className='size-5' />
    </button>
  )
}
