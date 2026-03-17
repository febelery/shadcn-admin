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
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { getFileIconType } from '@/lib/file-utils'
import { cn } from '@/lib/utils'
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
  const k = getFileIconType(file)
  if (k === 'image') return 'image'
  if (k === 'video') return 'video'
  if (k === 'audio') return 'audio'
  if (k === 'pdf') return 'pdf'
  return 'other'
}

// ---------------------------------------------------------------------------
// Blob URL
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Image transform hook
// ---------------------------------------------------------------------------

const ZOOM_MIN = 0.5
const ZOOM_MAX = 8
const ZOOM_STEP = 0.25

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi)
}

function useImageTransform(resetKey: unknown) {
  const [scale, setScale] = React.useState(1)
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })
  const isDragging = React.useRef(false)
  const dragStart = React.useRef({ mx: 0, my: 0, ox: 0, oy: 0 })
  const lastPinchDist = React.useRef<number | null>(null)
  const offsetRef = React.useRef(offset)
  const [containerEl, setContainerEl] = React.useState<HTMLDivElement | null>(
    null
  )

  React.useEffect(() => {
    offsetRef.current = offset
  }, [offset])

  React.useEffect(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
    isDragging.current = false
  }, [resetKey])

  const reset = React.useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])
  const zoomIn = React.useCallback(
    () =>
      setScale((s) => clamp(+(s + ZOOM_STEP).toFixed(2), ZOOM_MIN, ZOOM_MAX)),
    []
  )
  const zoomOut = React.useCallback(
    () =>
      setScale((s) => {
        const n = clamp(+(s - ZOOM_STEP).toFixed(2), ZOOM_MIN, ZOOM_MAX)
        if (n <= 1) setOffset({ x: 0, y: 0 })
        return n
      }),
    []
  )

  // wheel + touchmove
  React.useEffect(() => {
    if (!containerEl) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const d = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
      setScale((s) => {
        const n = clamp(+(s + d).toFixed(2), ZOOM_MIN, ZOOM_MAX)
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
      setScale((s) =>
        clamp(
          +(s * (dist / lastPinchDist.current!)).toFixed(2),
          ZOOM_MIN,
          ZOOM_MAX
        )
      )
      lastPinchDist.current = dist
    }
    const onTouchEnd = () => {
      lastPinchDist.current = null
    }

    containerEl.addEventListener('wheel', onWheel, { passive: false })
    containerEl.addEventListener('touchstart', onTouchStart, { passive: false })
    containerEl.addEventListener('touchmove', onTouchMove, { passive: false })
    containerEl.addEventListener('touchend', onTouchEnd)
    return () => {
      containerEl.removeEventListener('wheel', onWheel)
      containerEl.removeEventListener('touchstart', onTouchStart)
      containerEl.removeEventListener('touchmove', onTouchMove)
      containerEl.removeEventListener('touchend', onTouchEnd)
    }
  }, [containerEl])

  const onMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    isDragging.current = true
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      ox: offsetRef.current.x,
      oy: offsetRef.current.y,
    }
  }, [])
  const onMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return
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
    containerRef: setContainerEl,
    isDragging,
    scale,
    offset,
    reset,
    zoomIn,
    zoomOut,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp: stopDrag,
      onMouseLeave: stopDrag,
      onDoubleClick,
    },
  }
}

// ---------------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------------

export function FilePreviewDialog({
  open,
  onOpenChange,
  item,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: FilePreviewDialogProps) {
  const close = React.useCallback(() => onOpenChange(false), [onOpenChange])

  // lock body scroll
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
          'absolute inset-0 transition-opacity duration-250',
          open ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(28,28,38, 0.88) 0%, rgba(12,12,18,0.95) 100%)',
        }}
        onClick={close}
        aria-label='点击关闭'
      />

      {/* ── 内容层 ── */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 flex flex-col transition-all duration-250',
          open ? 'scale-100 opacity-100' : 'scale-[0.97] opacity-0'
        )}
      >
        {/* Top bar */}
        <div className='pointer-events-auto flex shrink-0 items-center gap-2 px-5 py-4'>
          <p className='min-w-0 flex-1 truncate text-sm font-medium text-white/60'>
            {item.file.name}
          </p>
          <div className='flex items-center gap-1'>
            {item.url && (
              <a
                href={item.url}
                download={item.file.name}
                target='_blank'
                rel='noreferrer'
                className='inline-flex size-8 items-center justify-center rounded-lg text-white/50 transition-all hover:bg-white/10 hover:text-white'
                aria-label='下载'
              >
                <DownloadIcon className='size-4' />
              </a>
            )}
            <button
              type='button'
              onClick={close}
              className='inline-flex size-8 items-center justify-center rounded-lg text-white/50 transition-all hover:bg-white/10 hover:text-white'
              aria-label='关闭'
            >
              <XIcon className='size-4' />
            </button>
          </div>
        </div>

        <div className='flex min-h-0 flex-1 items-center justify-center p-6'>
          <div
            className='pointer-events-auto'
            onClick={(e) => e.stopPropagation()}
          >
            <PreviewContent item={item} />
          </div>
        </div>

        {(hasPrev || hasNext) && (
          <div className='pointer-events-auto flex shrink-0 items-center justify-center gap-2 px-4 py-4'>
            <button
              type='button'
              onClick={onPrev}
              disabled={!hasPrev}
              className='inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-20'
            >
              <ChevronLeftIcon className='size-3.5' />
              上一个
            </button>
            <div className='h-3.5 w-px bg-white/15' />
            <button
              type='button'
              onClick={onNext}
              disabled={!hasNext}
              className='inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-20'
            >
              下一个
              <ChevronRightIcon className='size-3.5' />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

function PreviewContent({ item }: { item: FileItem }) {
  const kind = getPreviewKind(item.file)
  const needBlob = !item.url && item.file.size > 0
  const blobUrl = useBlobUrl(item.file, needBlob)
  const src = item.url ?? blobUrl

  switch (kind) {
    case 'image':
      return <ImagePreview src={src} alt={item.file.name} resetKey={item.id} />
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

// ---------------------------------------------------------------------------
// Image — zoom + pan，无外框
// ---------------------------------------------------------------------------

function ImagePreview({
  src,
  alt,
  resetKey,
}: {
  src: string | null
  alt: string
  resetKey: unknown
}) {
  const {
    containerRef,
    isDragging,
    scale,
    offset,
    reset,
    zoomIn,
    zoomOut,
    handlers,
  } = useImageTransform(resetKey)

  if (!src) return <NoPreview />

  const isTransformed = scale !== 1 || offset.x !== 0 || offset.y !== 0

  return (
    // 整体是 fit-content 宽度，不撑满，点击图片外侧的黑色区域能正常关闭
    <div className='flex flex-col items-center gap-3'>
      {/* 图片区域 — 无圆角无边框，直接裸浮在遮罩上 */}
      <div
        ref={containerRef}
        className={cn('cursor-grab overflow-hidden select-none')}
        style={{
          touchAction: 'none',
          // 限制最大尺寸但不固定，让图片自然大小
          maxWidth: '90vw',
          maxHeight: 'calc(100dvh - 160px)',
        }}
        {...handlers}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          // 图片本身不加圆角——灯箱里的图片应该是无边界的
          className='block max-h-[calc(100dvh-160px)] max-w-[90vw] object-contain'
          style={{
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
            transition: isDragging.current ? 'none' : 'transform 0.15s ease',
          }}
        />
      </div>

      {/* 缩放控制条 */}
      <div className='flex items-center gap-1'>
        <IconBtn onClick={zoomOut} disabled={scale <= ZOOM_MIN} label='缩小'>
          <ZoomOutIcon className='size-3.5' />
        </IconBtn>

        <button
          type='button'
          onClick={reset}
          className={cn(
            'min-w-14 rounded px-2 py-1 font-mono text-xs tabular-nums transition-all',
            isTransformed
              ? 'text-white/90 hover:bg-white/10'
              : 'text-white/30 hover:bg-white/10 hover:text-white/70'
          )}
          title='点击重置'
        >
          {Math.round(scale * 100)}%
        </button>

        <IconBtn onClick={zoomIn} disabled={scale >= ZOOM_MAX} label='放大'>
          <ZoomInIcon className='size-3.5' />
        </IconBtn>

        {isTransformed && (
          <IconBtn onClick={reset} label='重置' className='ml-1'>
            <RotateCcwIcon className='size-3.5' />
          </IconBtn>
        )}

        <span className='ml-3 hidden text-[10px] text-white/20 sm:inline'>
          滚轮缩放 · 拖拽平移 · 双击重置
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Video
// ---------------------------------------------------------------------------

function VideoPreview({ src }: { src: string | null }) {
  if (!src) return <NoPreview />
  return (
    <video
      src={src}
      controls
      autoPlay={false}
      className='max-h-[calc(100dvh-120px)] max-w-[90vw] rounded-xl shadow-2xl'
    />
  )
}

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------

function AudioPreview({ src, name }: { src: string | null; name: string }) {
  if (!src) return <NoPreview />
  return (
    <div
      className='flex w-80 flex-col items-center gap-6 rounded-2xl px-8 py-10'
      style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* 唱片封面占位 */}
      <div
        className='flex size-28 items-center justify-center rounded-full shadow-xl'
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <FileAudioIcon className='size-12 text-white/40' />
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
        style={{ colorScheme: 'dark' }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

function PdfPreview({ src, name }: { src: string | null; name: string }) {
  if (!src) return <NoPreview />
  return (
    <iframe
      src={src}
      title={name}
      className='rounded-xl bg-white shadow-2xl'
      style={{ width: 'min(860px, 92vw)', height: 'calc(100dvh - 120px)' }}
    />
  )
}

// ---------------------------------------------------------------------------
// Other
// ---------------------------------------------------------------------------

function OtherPreview({ file, url }: { file: File; url?: string }) {
  const kind = getFileIconType(file)
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
      className='flex flex-col items-center gap-5 rounded-2xl px-12 py-10'
      style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        className='flex size-20 items-center justify-center rounded-2xl'
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <Icon className='size-10 text-white/50' />
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

function IconBtn({
  onClick,
  disabled,
  label,
  className,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex size-7 items-center justify-center rounded text-white/45 transition-all',
        'hover:bg-white/10 hover:text-white',
        'disabled:pointer-events-none disabled:opacity-20',
        className
      )}
      aria-label={label}
    >
      {children}
    </button>
  )
}

function NoPreview() {
  return <p className='text-sm text-white/35'>暂无可预览的内容</p>
}
