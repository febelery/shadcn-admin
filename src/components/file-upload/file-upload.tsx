/**
 * 文件上传根组件
 */
import { defaultUpload } from '@/config/upload'
import { cn } from '@/lib/utils'
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
  upload = defaultUpload,
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
      <div className={cn('w-full', className)} {...props}>
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
