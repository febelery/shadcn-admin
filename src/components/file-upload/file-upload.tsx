/**
 * 文件上传主组件
 */
import * as React from 'react'
import type { FileUploadProps, UploadFunction } from '@/types/file-upload'
import { cn } from '@/lib/utils'
import { useQiniuUpload } from '@/hooks/use-qiniu-upload'
import { FilePreview } from '@/components/ui/file-preview'
import { FileUploadProvider } from './file-upload-context'
import { FileUploadDropzone } from './file-upload-dropzone'
import { useFileUpload } from './use-file-upload'

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
  // 根据配置创建上传函数（依赖注入）
  const qiniuUpload = useQiniuUpload()
  const uploadFn = React.useMemo<UploadFunction | undefined>(() => {
    if (!uploadProp) return undefined

    // 如果是函数，直接使用
    if (typeof uploadProp === 'function') {
      return uploadProp
    }

    // 如果是七牛配置，转换为上传函数
    return (file: File, options: { onProgress?: (progress: number) => void }) =>
      qiniuUpload.uploadFile(file, uploadProp, options)
  }, [uploadProp, qiniuUpload])

  const upload = useFileUpload({
    value,
    defaultValue,
    onChange,
    validation,
    upload: uploadFn as UploadFunction | undefined,
    disabled,
    onFileAccept,
    onFileReject,
    onUploadStart,
    onUploadProgress,
    onUploadSuccess,
    onUploadError,
  })

  return (
    <FileUploadProvider value={{ ...upload, view, cardSize, validation }}>
      <div className={cn('w-full', className)} {...props}>
        {children || <FileUploadDropzone />}
      </div>
      <FilePreview
        open={upload.isPreviewOpen}
        onOpenChange={upload.closePreview}
        file={upload.previewItem?.file}
        url={upload.previewItem?.url}
        onPrev={upload.prevPreview}
        onNext={upload.nextPreview}
        hasPrev={upload.hasPrev}
        hasNext={upload.hasNext}
      />
    </FileUploadProvider>
  )
}
