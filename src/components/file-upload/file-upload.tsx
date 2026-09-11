/**
 * 文件上传根组件
 */
import { useRef, useEffect } from 'react'
import { cn } from 'cn'
import { ImageCropper } from '../image-cropper'
import { FileUploadProvider } from './context'
import { FileUploadDropzone } from './dropzone'
import { FilePreviewDialog } from './preview'
import type { FileUploadProps } from './types'
import { useFileUpload } from './use-file-upload'

export function FileUpload({
  value,
  defaultValue,
  onChange,
  validation,
  view = 'list',
  cardSize = 'lg',
  variant = 'default',
  upload,
  disabled = false,
  className,
  onFileAccept,
  onFileReject,
  onUploadStart,
  onUploadProgress,
  onUploadSuccess,
  onUploadError,
  children,
  crop,
  aspect,
  ...props
}: FileUploadProps & Omit<React.ComponentProps<'div'>, 'onChange'>) {
  const state = useFileUpload({
    value,
    defaultValue,
    onChange,
    validation,
    upload,
    disabled,
    onFileAccept,
    onFileReject,
    onUploadStart,
    onUploadProgress,
    onUploadSuccess,
    onUploadError,
    crop,
    aspect,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const { resetFiles } = state

  // 监听所属 DOM <form> 的 reset 事件，重置时自动清理错误项并恢复初始状态
  useEffect(() => {
    const form = containerRef.current?.closest('form')
    if (!form) return

    const handleFormReset = () => {
      resetFiles()
    }

    form.addEventListener('reset', handleFormReset)
    return () => {
      form.removeEventListener('reset', handleFormReset)
    }
  }, [resetFiles])

  return (
    <FileUploadProvider
      value={{
        ...state,
        view,
        cardSize,
        variant,
        validation,
        crop,
        aspect,
      }}
    >
      <div ref={containerRef} className={cn('w-full', className)} {...props}>
        {children ?? <FileUploadDropzone />}
      </div>

      <FilePreviewDialog
        open={state.isPreviewOpen}
        onOpenChange={(open) => {
          if (!open) state.closePreview()
        }}
        item={state.previewItem}
        hasPrev={state.hasPrev}
        hasNext={state.hasNext}
        onPrev={state.goPrev}
        onNext={state.goNext}
      />

      {state.cropSource && (
        <ImageCropper
          source={state.cropSource}
          aspect={aspect}
          open={!!state.cropSource}
          onOpenChange={(open) => {
            if (!open) state.cancelCrop()
          }}
          onCropComplete={state.completeCrop}
        />
      )}
    </FileUploadProvider>
  )
}
