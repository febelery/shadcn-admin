/**
 * 文件上传组件
 */

// 组件
export { FileUpload } from './file-upload'
export { FileUploadDropzone } from './dropzone'
export { FileUploadItem } from './item'
export { FileThumbnail } from './thumbnail'
export { FilePreviewDialog } from './preview'

// Context
export { useFileUploadContext } from './context'

// Hook（供需要自定义渲染树的场景使用）
export { useFileUpload } from './use-file-upload'

// Types
export type {
  FileItem,
  FileStatus,
  FileView,
  CardSize,
  FileValidation,
  UploadFn,
  FileUploadProps,
} from './types'
