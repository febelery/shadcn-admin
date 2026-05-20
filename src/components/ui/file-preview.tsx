import * as React from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  RefreshCw,
  RotateCcw,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import * as ReactDOM from 'react-dom'
import { getFileKind, getFileKindFromUrl } from '@/lib/files'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FilePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file?: File
  url?: string
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}

function usePreviewState(open: boolean, file?: File, url?: string) {
  const [scale, setScale] = React.useState(1)
  const [rotate, setRotate] = React.useState(0)

  React.useEffect(() => {
    if (open) {
      setScale(1)
      setRotate(0)
    }
  }, [open, file, url])

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

  return { scale, rotate, zoomIn, zoomOut, rotateLeft, rotateRight, reset }
}

function usePreviewUrl(file?: File, url?: string) {
  const previewUrl = React.useMemo(
    () => url || (file ? URL.createObjectURL(file) : ''),
    [url, file]
  )

  React.useEffect(() => {
    return () => {
      if (file && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [file, previewUrl])

  return previewUrl
}

function useFileType(file?: File, url?: string) {
  return React.useMemo(() => {
    if (file) return getFileKind(file)
    if (url) return getFileKindFromUrl(url)
    return 'file'
  }, [file, url])
}

function useKeyboardNavigation(
  open: boolean,
  onClose: () => void,
  onPrev?: () => void,
  onNext?: () => void,
  hasPrev?: boolean,
  hasNext?: boolean
) {
  React.useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onPrev?.()
      if (e.key === 'ArrowRight' && hasNext) onNext?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, onPrev, onNext, hasPrev, hasNext])
}

const ControlButton = ({
  icon: Icon,
  onClick,
  tooltip,
}: {
  icon: React.ElementType
  onClick: () => void
  tooltip: string
}) => (
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

const NavigationButton = ({
  direction,
  onClick,
}: {
  direction: 'left' | 'right'
  onClick: () => void
}) => {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight
  const className =
    direction === 'left'
      ? 'absolute top-1/2 left-4 z-50 -translate-y-1/2'
      : 'absolute top-1/2 right-4 z-50 -translate-y-1/2'

  return (
    <button
      type='button'
      className={cn(
        className,
        'rounded-full bg-black/50 p-2 text-white/80 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white'
      )}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <Icon className='size-8' />
    </button>
  )
}

const Toolbar = ({
  type,
  scale,
  onDownload,
  onClose,
  imageControls,
  previewUrl,
}: {
  type: string
  scale: number
  onDownload: () => void
  onClose: () => void
  previewUrl: string
  imageControls: {
    zoomIn: () => void
    zoomOut: () => void
    rotateLeft: () => void
    rotateRight: () => void
    reset: () => void
  }
}) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败', err)
    }
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 z-50 flex w-full items-center gap-4 overflow-x-auto bg-black/80 px-4 py-3 backdrop-blur-md',
        'md:absolute md:bottom-4 md:left-1/2 md:w-auto md:-translate-x-1/2 md:justify-center md:gap-2 md:rounded-full md:bg-black/50 md:p-2 md:px-3 md:py-2'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <ControlButton icon={Download} onClick={onDownload} tooltip='下载' />
      <ControlButton
        icon={copied ? Check : Copy}
        onClick={handleCopyLink}
        tooltip={copied ? '已复制' : '复制链接'}
      />

      {type === 'image' && (
        <>
          <div className='mx-1 h-4 w-px bg-white/20' />
          <ControlButton
            icon={ZoomOut}
            onClick={imageControls.zoomOut}
            tooltip='缩小'
          />
          <span className='w-12 text-center text-sm font-medium text-white'>
            {Math.round(scale * 100)}%
          </span>
          <ControlButton
            icon={ZoomIn}
            onClick={imageControls.zoomIn}
            tooltip='放大'
          />
          <div className='mx-1 h-4 w-px bg-white/20' />
          <ControlButton
            icon={RotateCcw}
            onClick={imageControls.rotateLeft}
            tooltip='向左旋转'
          />
          <ControlButton
            icon={RotateCw}
            onClick={imageControls.rotateRight}
            tooltip='向右旋转'
          />
          <div className='mx-1 h-4 w-px bg-white/20' />
          <ControlButton
            icon={RefreshCw}
            onClick={imageControls.reset}
            tooltip='重置'
          />
        </>
      )}

      <div className='mx-1 h-4 w-px bg-white/20' />
      <ControlButton icon={X} onClick={onClose} tooltip='关闭' />
    </div>
  )
}

const PreviewContent = ({
  type,
  previewUrl,
  scale,
  rotate,
}: {
  type: string
  previewUrl: string
  scale: number
  rotate: number
}) => {
  if (type === 'image') {
    return (
      <div className='relative flex size-full items-center justify-center'>
        <img
          src={previewUrl}
          alt='preview'
          className='max-h-full max-w-full object-contain transition-transform duration-200 ease-out'
          style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
        />
      </div>
    )
  }

  if (type === 'video') {
    return (
      <div className='aspect-video w-full max-w-5xl overflow-hidden rounded-lg bg-black shadow-2xl'>
        <video controls src={previewUrl} className='size-full'>
          您的浏览器不支持视频标签。
        </video>
      </div>
    )
  }

  if (type === 'audio') {
    return (
      <div className='w-full max-w-md rounded-xl bg-transparent p-4 shadow-2xl'>
        <audio controls src={previewUrl} className='w-full'>
          您的浏览器不支持音频标签。
        </audio>
      </div>
    )
  }

  if (['excel', 'word', 'powerpoint', 'pdf'].includes(type)) {
    return (
      <div className='size-full overflow-hidden rounded-lg bg-white'>
        {type === 'pdf' ? (
          <iframe src={previewUrl} className='size-full' title='PDF Preview' />
        ) : (
          <iframe
            src={`https://ranuts.github.io/document/?locale=zh&src=${encodeURIComponent(previewUrl)}`}
            className='size-full'
            title='Office Preview'
          />
        )}
      </div>
    )
  }

  return (
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
  )
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
  const type = useFileType(file, url)
  const previewUrl = usePreviewUrl(file, url)
  const { scale, rotate, ...imageControls } = usePreviewState(open, file, url)

  const handleClose = React.useCallback(
    () => onOpenChange(false),
    [onOpenChange]
  )

  useKeyboardNavigation(open, handleClose, onPrev, onNext, hasPrev, hasNext)

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
          <div
            className='relative flex h-[90vh] w-[90vw] items-center justify-center overflow-hidden rounded-lg'
            onClick={(e) => e.stopPropagation()}
          >
            {hasPrev && (
              <NavigationButton direction='left' onClick={() => onPrev?.()} />
            )}
            {hasNext && (
              <NavigationButton direction='right' onClick={() => onNext?.()} />
            )}

            <Toolbar
              type={type}
              scale={scale}
              onDownload={handleDownload}
              onClose={handleClose}
              previewUrl={previewUrl}
              imageControls={imageControls}
            />

            <PreviewContent
              type={type}
              previewUrl={previewUrl}
              scale={scale}
              rotate={rotate}
            />
          </div>
        </div>
      )}
    </AnimatePresence>
  )

  return ReactDOM.createPortal(modalContent, document.body)
}
