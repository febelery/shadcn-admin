/**
 * 文件上传根组件
 */
import * as React from 'react'
import { cn } from '@/lib/utils'
import { FileUploadProvider } from './context'
import { FileUploadDropzone } from './dropzone'
import { FilePreviewDialog } from './preview'
import type { FileUploadProps, UploadFn } from './types'
import { useFileUpload } from './use-file-upload'
import { useQiniuUpload } from './use-qiniu-upload'

export function FileUpload({
  value,
  defaultValue,
  onChange,
  validation,
  view = 'list',
  cardSize = 'lg',
  upload: uploadProp,
  disabled = false,
  className,
  onFileAccept,
  onFileReject,
  onUploadStart,
  onUploadProgress,
  onUploadSuccess,
  onUploadError,
  children,
  ...props
}: FileUploadProps & Omit<React.ComponentProps<'div'>, 'onChange'>) {
  const qiniu = useQiniuUpload()

  // 将 QiniuConfig 或 UploadFn 统一转换为 UploadFn
  const uploadFn = React.useMemo<UploadFn | undefined>(() => {
    if (!uploadProp) return undefined
    if (typeof uploadProp === 'function') return uploadProp
    // QiniuConfig 分支
    const config = uploadProp
    return (file, options) => qiniu.uploadFile(file, config, options)
  }, [uploadProp, qiniu])

  const state = useFileUpload({
    value,
    defaultValue,
    onChange,
    validation,
    upload: uploadFn,
    disabled,
    onFileAccept,
    onFileReject,
    onUploadStart,
    onUploadProgress,
    onUploadSuccess,
    onUploadError,
  })

  return (
    <FileUploadProvider value={{ ...state, view, cardSize, validation }}>
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
    </FileUploadProvider>
  )
}
