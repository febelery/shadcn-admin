import * as React from 'react'
import {
  Crop as CropIcon,
  Loader2,
  Maximize,
  Square,
  RectangleHorizontal,
  Monitor,
} from 'lucide-react'
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { CropSource } from './file-upload/types'

interface ImageCropperProps {
  /** 统一的图像来源：本地文件 或 远程 URL，内部自动处理两种场景 */
  source: CropSource
  aspect?: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onCropComplete: (file: File) => void
  title?: string
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  )
}

/**
 * 从 CropSource 推导出用于渲染的图像 URL 字符串。
 * - file 类型：创建 ObjectURL（组件内部管理生命周期）
 * - url 类型：直接使用远程 URL
 *
 * 返回 [resolvedSrc, cleanup]，调用方在 useEffect 中负责执行 cleanup。
 */
function resolveSrc(source: CropSource): [string, (() => void) | undefined] {
  if (source.type === 'url') {
    return [source.url, undefined]
  }
  // file 类型，仅对有内容的文件创建 ObjectURL
  if (source.file.size > 0) {
    const objectUrl = URL.createObjectURL(source.file)
    return [objectUrl, () => URL.revokeObjectURL(objectUrl)]
  }
  return ['', undefined]
}

/** 从 CropSource 推导出最终输出 File 的元信息 */
function resolveOutputMeta(source: CropSource): { name: string; type: string } {
  if (source.type === 'file') {
    return { name: source.file.name, type: source.file.type || 'image/png' }
  }
  return { name: source.name, type: source.mimeType || 'image/png' }
}

export function ImageCropper({
  source,
  aspect: initialAspect,
  open,
  onOpenChange,
  onCropComplete,
  title = '编辑图片',
}: ImageCropperProps) {
  const [previewSrc, setPreviewSrc] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [isPending, startHostTransition] = React.useTransition()
  const imgRef = React.useRef<HTMLImageElement>(null)

  const [crop, setCrop] = React.useState<Crop>()
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop>()
  const [aspect, setAspect] = React.useState<number | undefined>(initialAspect)

  // 当 source 或 open 变化时，重新解析预览 URL 并管理 ObjectURL 生命周期
  React.useEffect(() => {
    if (!open) {
      setPreviewSrc('')
      setIsLoading(true)
      return
    }

    setIsLoading(true)
    const [src, cleanup] = resolveSrc(source)
    setPreviewSrc(src)

    return cleanup
  }, [source, open])

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    setIsLoading(false)
    const { width, height } = e.currentTarget
    setCrop(
      aspect
        ? centerAspectCrop(width, height, aspect)
        : { unit: '%', width: 90, height: 90, x: 5, y: 5 }
    )
  }

  const handleConfirm = () => {
    if (!imgRef.current || !completedCrop) return

    startHostTransition(async () => {
      const image = imgRef.current!
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      const canvas = document.createElement('canvas')
      const finalWidth = Math.round(completedCrop.width * scaleX)
      const finalHeight = Math.round(completedCrop.height * scaleY)

      canvas.width = finalWidth
      canvas.height = finalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        finalWidth,
        finalHeight
      )

      const { name, type } = resolveOutputMeta(source)
      return new Promise<void>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            onCropComplete(new File([blob], name, { type }))
            onOpenChange(false)
          }
          resolve()
        }, type)
      })
    })
  }

  const aspects = [
    { label: '自由', value: undefined, icon: Maximize },
    { label: '1:1', value: 1, icon: Square },
    { label: '4:3', value: 4 / 3, icon: Monitor },
    { label: '16:9', value: 16 / 9, icon: RectangleHorizontal },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[96vh] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden border-none p-0 shadow-2xl transition-all duration-300 sm:max-w-4xl sm:rounded-2xl lg:max-w-5xl'>
        <DialogHeader className='shrink-0 px-6 py-4'>
          <DialogTitle className='text-base font-bold tracking-tight'>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className='relative flex min-h-[400px] flex-1 items-center justify-center overflow-hidden border-y bg-zinc-100/80 p-4 shadow-inner md:p-6 dark:bg-zinc-950/80'>
          {/* 加载态 */}
          {(!previewSrc || isLoading) && (
            <div className='animate-in fade-in absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-zinc-100/50 backdrop-blur-[1px] duration-300 dark:bg-zinc-950/50'>
              <Loader2 className='size-8 animate-spin text-zinc-400' />
              <span className='text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase'>
                正在载入图像资源
              </span>
            </div>
          )}

          {previewSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, p) => setCrop(p)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              className={cn(
                'rounded-md shadow-sm transition-opacity duration-700 ease-in-out',
                isLoading ? 'pointer-events-none opacity-0' : 'opacity-100'
              )}
            >
              <img
                ref={imgRef}
                alt='Crop preview'
                src={previewSrc}
                crossOrigin='anonymous'
                style={{ maxHeight: 'calc(96vh - 190px)' }}
                className={cn(
                  'block w-auto max-w-full transition-all duration-500 ease-out',
                  isPending
                    ? 'scale-[0.98] opacity-50 blur-[2px]'
                    : 'opacity-100'
                )}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          )}

          {/* 处理中遮罩 */}
          {isPending && (
            <div className='bg-background/40 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md'>
              <div className='bg-background/80 flex flex-col items-center gap-3 rounded-xl px-6 py-4 shadow-xl backdrop-blur-xl'>
                <Loader2 className='text-primary size-6 animate-spin' />
                <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                  正在处理高画质图像
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='bg-background flex shrink-0 flex-col items-center justify-between gap-4 p-4 sm:flex-row sm:px-6 sm:py-4'>
          <div className='flex w-full flex-wrap items-center justify-center gap-3 sm:w-auto sm:justify-start'>
            {!initialAspect && (
              <div className='bg-muted/50 border-border/50 flex items-center gap-1 rounded-xl border p-1 shadow-sm'>
                {aspects.map((p) => {
                  const Icon = p.icon
                  const isActive = aspect === p.value
                  return (
                    <button
                      key={p.label}
                      onClick={() => {
                        setAspect(p.value)
                        if (imgRef.current && p.value) {
                          const { width, height } = imgRef.current
                          setCrop(centerAspectCrop(width, height, p.value))
                        }
                      }}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200',
                        isActive
                          ? 'bg-background text-foreground ring-border/50 shadow-sm ring-1'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon
                        className={cn(
                          'size-3.5',
                          isActive ? 'text-primary' : 'opacity-70'
                        )}
                      />
                      {p.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className='flex w-full items-center justify-end gap-2 sm:w-auto'>
            <Button
              type='button'
              variant='ghost'
              className='hover:bg-muted/50 text-xs font-medium'
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              取消
            </Button>
            <Button
              type='button'
              className='px-6 text-xs font-bold shadow-md transition-all active:scale-95'
              onClick={handleConfirm}
              disabled={!completedCrop || isPending}
            >
              {isPending ? (
                <Loader2 className='mr-2 size-3.5 animate-spin' />
              ) : (
                <CropIcon className='mr-2 size-3.5' />
              )}
              {isPending ? '处理中' : '确认'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
