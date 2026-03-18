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
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { getFileIconType } from '@/lib/file-utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
  const [currentScale, setCurrentScale] = React.useState(1)
  const close = React.useCallback(() => onOpenChange(false), [onOpenChange])

  React.useEffect(() => {
    setCurrentScale(1)
  }, [item?.id])

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
        <div className='pointer-events-auto flex items-center justify-between border-b border-white/5 bg-black/40 px-6 py-3.5 backdrop-blur-xl'>
          {/* 左侧：文件信息与缩放 */}
          <div className='flex min-w-[200px] items-center gap-3'>
            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10'>
              {(() => {
                const kind = getFileIconType(item.file)
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
              <div className='flex items-center gap-2'>
                <p className='max-w-[240px] truncate text-sm font-semibold text-white/90'>
                  {item.file.name}
                </p>
                {getPreviewKind(item.file) === 'image' && (
                  <span className='inline-flex items-center justify-center rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-white/70 ring-1 ring-white/10'>
                    {Math.round(currentScale * 100)}%
                  </span>
                )}
              </div>
              <p className='text-[10px] font-bold tracking-[0.05em] text-white/30 uppercase'>
                {item.file.type.split('/')[1] || 'FILE'}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-1 text-white/40'>
            {/* 分页切换组 */}
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

            <div className='mx-2 h-4 w-px bg-white/10' />

            {item.url && (
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
            )}
            <div className='mx-2 h-4 w-px bg-white/10' />
            <Button
              variant='ghost'
              size='icon'
              onClick={close}
              className='h-9 w-9 text-white/60 hover:bg-white/10 hover:text-white'
              aria-label='关闭'
            >
              <XIcon className='size-4' />
            </Button>
          </div>
        </div>

        <div className='relative min-h-0 flex-1 overflow-hidden'>
          <div className='flex h-full w-full items-center justify-center'>
            <PreviewContent item={item} onScaleChange={setCurrentScale} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function PreviewContent({
  item,
  onScaleChange,
}: {
  item: FileItem
  onScaleChange?: (scale: number) => void
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
          resetKey={item.id}
          onScaleChange={onScaleChange}
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

/** 图片预览组件 */
function ImagePreview({
  src,
  alt,
  resetKey,
  onScaleChange,
}: {
  src: string | null
  alt: string
  resetKey: unknown
  onScaleChange?: (scale: number) => void
}) {
  const { containerRef, isDragging, scale, offset, handlers } =
    useImageTransform(resetKey)

  React.useEffect(() => {
    onScaleChange?.(scale)
  }, [scale, onScaleChange])

  if (!src) return <NoPreview />

  return (
    <div className='relative flex h-full w-full items-center justify-center'>
      {/* ── 图片容器：居中，仅在内容处拦截点击 ── */}
      <div
        ref={containerRef}
        className={cn(
          'pointer-events-auto relative cursor-grab overflow-hidden rounded-lg select-none'
        )}
        style={{ touchAction: 'none' }}
        {...handlers}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className='max-h-[calc(100dvh-120px)] max-w-[90vw] object-contain shadow-2xl transition-shadow duration-300'
          style={{
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
            transition: isDragging.current ? 'none' : 'transform 0.15s ease',
          }}
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
