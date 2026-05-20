/**
 * 文件预览，使用 createPortal
 */
import * as React from 'react'
import {
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileIcon,
  FileTextIcon,
  FileVideoIcon,
  FileAudioIcon,
  FileCodeIcon,
  FileArchiveIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RotateCcwIcon,
  RotateCwIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { getFileKind } from '@/lib/files'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { FileItem } from './types'

export interface FilePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: FileItem
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
}

type PreviewKind = 'image' | 'video' | 'audio' | 'pdf' | 'other'

function getPreviewKind(file: File): PreviewKind {
  const k = getFileKind(file)
  if (k === 'image') return 'image'
  if (k === 'video') return 'video'
  if (k === 'audio') return 'audio'
  if (k === 'pdf') return 'pdf'
  return 'other'
}

function useBlobUrl(file: File, enabled: boolean) {
  const [url, setUrl] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!enabled || file.size === 0) {
      setUrl(null)
      return
    }
    const blob = URL.createObjectURL(file)
    setUrl(blob)
    return () => URL.revokeObjectURL(blob)
  }, [file, enabled])
  return url
}

const ZOOM_MIN = 0.25
const ZOOM_MAX = 128
const ZOOM_WHEEL_FACTOR = 1.12
const ZOOM_BUTTON_FACTOR = 1.25

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi)
}

function nextZoom(scale: number, factor: number) {
  return clamp(+(scale * factor).toFixed(3), ZOOM_MIN, ZOOM_MAX)
}

function useImageTransform(
  resetKey: unknown,
  viewportEl: HTMLDivElement | null,
  enabled = true
) {
  const [scale, setScale] = React.useState(1)
  const [rotate, setRotate] = React.useState(0)
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })
  const isDragging = React.useRef(false)
  const dragStart = React.useRef({ mx: 0, my: 0, ox: 0, oy: 0 })
  const lastPinchDist = React.useRef<number | null>(null)
  const offsetRef = React.useRef(offset)
  const scaleRef = React.useRef(scale)

  React.useEffect(() => {
    offsetRef.current = offset
  }, [offset])

  React.useEffect(() => {
    scaleRef.current = scale
  }, [scale])

  React.useEffect(() => {
    setScale(1)
    setRotate(0)
    setOffset({ x: 0, y: 0 })
    isDragging.current = false
  }, [resetKey])

  const reset = React.useCallback(() => {
    setScale(1)
    setRotate(0)
    setOffset({ x: 0, y: 0 })
  }, [])
  const rotateLeft = React.useCallback(() => setRotate((r) => r - 90), [])
  const rotateRight = React.useCallback(() => setRotate((r) => r + 90), [])
  const zoomIn = React.useCallback(
    () => setScale((s) => nextZoom(s, ZOOM_BUTTON_FACTOR)),
    []
  )
  const zoomOut = React.useCallback(
    () =>
      setScale((s) => {
        const n = nextZoom(s, 1 / ZOOM_BUTTON_FACTOR)
        if (n <= 1) setOffset({ x: 0, y: 0 })
        return n
      }),
    []
  )

  // 滚轮/双指缩放绑在视口层（capture），空白区仍可点击穿透关闭
  React.useEffect(() => {
    if (!viewportEl || !enabled) return
    const opts = { passive: false, capture: true } as const

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY < 0 ? ZOOM_WHEEL_FACTOR : 1 / ZOOM_WHEEL_FACTOR
      setScale((s) => {
        const n = nextZoom(s, factor)
        if (n <= 1) setOffset({ x: 0, y: 0 })
        return n
      })
    }
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      lastPinchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || lastPinchDist.current === null) return
      e.preventDefault()
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      setScale((s) => nextZoom(s, dist / lastPinchDist.current!))
      lastPinchDist.current = dist
    }
    const onTouchEnd = () => {
      lastPinchDist.current = null
    }

    viewportEl.addEventListener('wheel', onWheel, opts)
    viewportEl.addEventListener('touchstart', onTouchStart, opts)
    viewportEl.addEventListener('touchmove', onTouchMove, opts)
    viewportEl.addEventListener('touchend', onTouchEnd)
    return () => {
      viewportEl.removeEventListener('wheel', onWheel, opts)
      viewportEl.removeEventListener('touchstart', onTouchStart, opts)
      viewportEl.removeEventListener('touchmove', onTouchMove, opts)
      viewportEl.removeEventListener('touchend', onTouchEnd)
    }
  }, [viewportEl, enabled])

  const onMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || scaleRef.current <= 1) return
    isDragging.current = true
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      ox: offsetRef.current.x,
      oy: offsetRef.current.y,
    }
  }, [])
  const onMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || scaleRef.current <= 1) return
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.mx),
      y: dragStart.current.oy + (e.clientY - dragStart.current.my),
    })
  }, [])
  const stopDrag = React.useCallback(() => {
    isDragging.current = false
  }, [])
  const onDoubleClick = React.useCallback(() => reset(), [reset])

  return {
    isDragging,
    scale,
    rotate,
    offset,
    reset,
    zoomIn,
    zoomOut,
    rotateLeft,
    rotateRight,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp: stopDrag,
      onMouseLeave: stopDrag,
      onDoubleClick,
    },
  }
}

type ImageTransform = ReturnType<typeof useImageTransform>

function ToolbarTooltip({
  label,
  children,
}: {
  label: string
  children: React.ReactElement
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side='bottom' sideOffset={6} className='text-xs'>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

function ImagePreviewToolbar({ transform }: { transform: ImageTransform }) {
  const { scale, zoomIn, zoomOut, rotateLeft, rotateRight, reset } = transform
  const btnClass = 'h-9 w-9 text-white/60 hover:bg-white/10 hover:text-white'

  return (
    <div className='flex items-center gap-0.5'>
      <ToolbarTooltip label='缩小'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={btnClass}
          onClick={zoomOut}
          aria-label='缩小'
        >
          <ZoomOutIcon className='size-4' />
        </Button>
      </ToolbarTooltip>
      <span className='min-w-10 text-center font-mono text-xs text-white/60'>
        {Math.round(scale * 100)}%
      </span>
      <ToolbarTooltip label='放大'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={btnClass}
          onClick={zoomIn}
          aria-label='放大'
        >
          <ZoomInIcon className='size-4' />
        </Button>
      </ToolbarTooltip>
      <ToolbarTooltip label='向左旋转'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={btnClass}
          onClick={rotateLeft}
          aria-label='向左旋转'
        >
          <RotateCcwIcon className='size-4' />
        </Button>
      </ToolbarTooltip>
      <ToolbarTooltip label='向右旋转'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={btnClass}
          onClick={rotateRight}
          aria-label='向右旋转'
        >
          <RotateCwIcon className='size-4' />
        </Button>
      </ToolbarTooltip>
      <ToolbarTooltip label='重置视图'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={btnClass}
          onClick={reset}
          aria-label='重置视图'
        >
          <RefreshCwIcon className='size-4' />
        </Button>
      </ToolbarTooltip>
    </div>
  )
}

/** 文件预览弹窗组件 */
export function FilePreviewDialog({
  open,
  onOpenChange,
  item,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: FilePreviewDialogProps) {
  const [viewportEl, setViewportEl] = React.useState<HTMLDivElement | null>(
    null
  )
  const close = React.useCallback(() => onOpenChange(false), [onOpenChange])

  const previewKind = item ? getPreviewKind(item.file) : 'other'
  const isImage = previewKind === 'image'
  const imageTransform = useImageTransform(
    item?.id,
    viewportEl,
    isImage && open
  )

  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // keyboard
  React.useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault()
        onPrev()
      }
      if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault()
        onNext()
      }
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [open, hasPrev, hasNext, onPrev, onNext, close])

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    if (open) setMounted(true)
  }, [open])
  const handleTransitionEnd = React.useCallback(() => {
    if (!open) setMounted(false)
  }, [open])

  if (!mounted || !item) return null

  return createPortal(
    <div
      role='dialog'
      aria-modal='true'
      aria-label={`预览 ${item.file.name}`}
      className='fixed inset-0 z-50'
      onTransitionEnd={handleTransitionEnd}
    >
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-300 ease-in-out',
          open ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          background:
            'radial-gradient(circle at center, rgba(31, 31, 46, 0.4) 0%, rgba(10, 10, 15, 0.75) 100%)',
          backdropFilter: open ? 'blur(4px)' : 'blur(0px)',
        }}
        aria-label='预览背景'
        onClick={close}
      />

      {/* 内容层 */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 flex flex-col transition-all duration-250',
          open ? 'scale-100 opacity-100' : 'scale-[0.97] opacity-0'
        )}
      >
        {/* Top bar */}
        <div className='pointer-events-auto relative flex items-center justify-between border-b border-white/5 bg-black/40 px-6 py-3.5 backdrop-blur-xl'>
          {/* 左侧：文件信息 */}
          <div className='flex min-w-[200px] items-center gap-3'>
            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10'>
              {(() => {
                const kind = getFileKind(item.file)
                const Icon =
                  (
                    {
                      video: FileVideoIcon,
                      audio: FileAudioIcon,
                      pdf: FileTextIcon,
                      code: FileCodeIcon,
                      archive: FileArchiveIcon,
                      text: FileTextIcon,
                    } as any
                  )[kind] ?? FileIcon
                return <Icon className='size-5 text-white/80' />
              })()}
            </div>
            <div className='min-w-0'>
              <p className='max-w-[240px] truncate text-sm font-semibold text-white/90'>
                {item.file.name}
              </p>
              <p className='text-[10px] font-bold tracking-wider text-white/30 uppercase'>
                {item.file.type.split('/')[1] || 'FILE'}
              </p>
            </div>
          </div>

          {isImage ? (
            <div className='absolute left-1/2 flex -translate-x-1/2 items-center'>
              <ImagePreviewToolbar transform={imageTransform} />
            </div>
          ) : null}

          <div className='flex items-center gap-1 text-white/40'>
            <ToolbarTooltip label='上一个'>
              <span className='inline-flex'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={onPrev}
                  disabled={!hasPrev}
                  className='h-9 w-9 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-20'
                  aria-label='上一个'
                >
                  <ChevronLeftIcon className='size-5' />
                </Button>
              </span>
            </ToolbarTooltip>
            <ToolbarTooltip label='下一个'>
              <span className='inline-flex'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={onNext}
                  disabled={!hasNext}
                  className='h-9 w-9 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-20'
                  aria-label='下一个'
                >
                  <ChevronRightIcon className='size-5' />
                </Button>
              </span>
            </ToolbarTooltip>

            <div className='mx-2 h-4 w-px bg-white/10' />

            {item.url && (
              <ToolbarTooltip label='下载'>
                <Button
                  variant='ghost'
                  size='icon'
                  asChild
                  className='h-9 w-9 text-white/60 hover:bg-white/10 hover:text-white'
                >
                  <a
                    href={item.url}
                    download={item.file.name}
                    target='_blank'
                    rel='noreferrer'
                    aria-label='下载'
                  >
                    <DownloadIcon className='size-4' />
                  </a>
                </Button>
              </ToolbarTooltip>
            )}
            <div className='mx-2 h-4 w-px bg-white/10' />
            <ToolbarTooltip label='关闭'>
              <Button
                variant='ghost'
                size='icon'
                onClick={close}
                className='h-9 w-9 text-white/60 hover:bg-white/10 hover:text-white'
                aria-label='关闭'
              >
                <XIcon className='size-4' />
              </Button>
            </ToolbarTooltip>
          </div>
        </div>

        <div
          ref={setViewportEl}
          className='pointer-events-auto relative flex min-h-0 flex-1 items-center justify-center'
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <PreviewContent
            item={item}
            imageTransform={isImage ? imageTransform : undefined}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}

function PreviewContent({
  item,
  imageTransform,
}: {
  item: FileItem
  imageTransform?: ImageTransform
}) {
  const kind = getPreviewKind(item.file)
  const needBlob = !item.url && item.file.size > 0
  const blobUrl = useBlobUrl(item.file, needBlob)
  const src = item.url ?? blobUrl

  switch (kind) {
    case 'image':
      return (
        <ImagePreview
          src={src}
          alt={item.file.name}
          transform={imageTransform!}
        />
      )
    case 'video':
      return <VideoPreview src={src} />
    case 'audio':
      return <AudioPreview src={src} name={item.file.name} />
    case 'pdf':
      return <PdfPreview src={src} name={item.file.name} />
    default:
      return <OtherPreview file={item.file} url={item.url} />
  }
}

/** 图片预览：视口层缩放 + 仅图片区域拦截点击/拖拽 */
function ImagePreview({
  src,
  alt,
  transform,
}: {
  src: string | null
  alt: string
  transform: ImageTransform
}) {
  const { isDragging, scale, rotate, offset, handlers } = transform
  const [dragging, setDragging] = React.useState(false)

  if (!src) return <NoPreview />

  const mergedHandlers = {
    ...handlers,
    onMouseDown: (e: React.MouseEvent) => {
      if (scale <= 1) return
      setDragging(true)
      handlers.onMouseDown(e)
    },
    onMouseUp: () => {
      setDragging(false)
      handlers.onMouseUp()
    },
    onMouseLeave: () => {
      setDragging(false)
      handlers.onMouseLeave()
    },
  }

  return (
    <div className='pointer-events-none absolute inset-0 overflow-hidden select-none'>
      <div
        className={cn(
          'pointer-events-auto absolute top-1/2 left-1/2 will-change-transform',
          scale > 1 ? 'cursor-grab' : 'cursor-zoom-in',
          dragging && 'cursor-grabbing'
        )}
        style={{
          touchAction: 'none',
          transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale}) rotate(${rotate}deg)`,
          transition: isDragging.current ? 'none' : 'transform 0.12s ease-out',
        }}
        {...mergedHandlers}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className='block max-h-[calc(100dvh-120px)] max-w-[90vw] object-contain shadow-2xl'
        />
      </div>
    </div>
  )
}

/** 视频预览组件 */
function VideoPreview({ src }: { src: string | null }) {
  if (!src) return <NoPreview />
  return (
    <video
      src={src}
      controls
      autoPlay={false}
      className='pointer-events-auto max-h-[calc(100dvh-120px)] max-w-[90vw] rounded-xl shadow-2xl'
      onClick={(e) => e.stopPropagation()}
    />
  )
}

/** 音频预览组件 */

function AudioPreview({ src, name }: { src: string | null; name: string }) {
  if (!src) return <NoPreview />
  return (
    <div
      className='shadow-3xl pointer-events-auto flex w-96 flex-col items-center gap-8 rounded-3xl border border-white/10 px-10 py-12'
      style={{
        background:
          'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(24px)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className='relative'>
        <div className='absolute inset-0 animate-ping rounded-full bg-white/5 opacity-20' />
        <div
          className='relative flex size-32 items-center justify-center rounded-full shadow-2xl ring-1 ring-white/15'
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <FileAudioIcon className='size-14 text-white/60 drop-shadow-lg' />
        </div>
      </div>

      {/* 文件名 */}
      <p className='w-full truncate text-center text-sm font-medium text-white/70'>
        {name}
      </p>

      {/* 播放器 */}
      <audio
        src={src}
        controls
        className='w-full'
        style={{ colorScheme: 'dark', filter: 'brightness(0.9) contrast(1.1)' }}
      />
    </div>
  )
}

/** PDF 预览组件 */
function PdfPreview({ src, name }: { src: string | null; name: string }) {
  if (!src) return <NoPreview />
  return (
    <iframe
      src={src}
      title={name}
      className='pointer-events-auto rounded-xl bg-white shadow-2xl'
      style={{ width: 'min(860px, 92vw)', height: 'calc(100dvh - 120px)' }}
      onClick={(e) => e.stopPropagation()}
    />
  )
}

/** 通用文件预览组件 */
function OtherPreview({ file, url }: { file: File; url?: string }) {
  const kind = getFileKind(file)
  const Icon =
    (
      {
        video: FileVideoIcon,
        audio: FileAudioIcon,
        pdf: FileTextIcon,
        code: FileCodeIcon,
        archive: FileArchiveIcon,
        text: FileTextIcon,
      } as Record<string, React.ElementType>
    )[kind] ?? FileIcon

  return (
    <div
      className='shadow-3xl pointer-events-auto flex flex-col items-center gap-6 rounded-3xl border border-white/10 px-14 py-12'
      style={{
        background:
          'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(24px)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className='flex size-24 items-center justify-center rounded-2xl ring-1 ring-white/15'
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <Icon className='size-12 text-white/60 drop-shadow-md' />
      </div>
      <div className='text-center'>
        <p className='max-w-xs truncate text-sm font-medium text-white/75'>
          {file.name}
        </p>
        <p className='mt-1.5 text-xs text-white/35'>暂不支持在线预览</p>
      </div>
      {url && (
        <a
          href={url}
          download={file.name}
          target='_blank'
          rel='noreferrer'
          className='inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-white/55 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white'
        >
          <DownloadIcon className='size-3.5' />
          下载文件
        </a>
      )}
    </div>
  )
}

function NoPreview() {
  return <p className='text-sm text-white/35'>暂无可预览的内容</p>
}
