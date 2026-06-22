/**
 * 文件上传组件 — 类型定义
 */

export type FileStatus = 'idle' | 'uploading' | 'success' | 'error'
export type FileView = 'list' | 'card'
export type CardSize = 'sm' | 'lg' | 'full'
export type FileVariant = 'default' | 'minimal' | 'button'

export interface FileItem {
  id: string
  file: File
  /** 上传成功后的服务端 URL，或回显时的原始 URL */
  url?: string
  progress: number
  status: FileStatus
  error?: string
  /**
   * 是否为本次会话中新上传的文件（而非通过 value/defaultValue 回显的）
   * 用于控制上传成功/失败的短暂动画效果
   */
  isNewUpload?: boolean
}

/**
 * 裁剪图像来源
 *
 * - `file`：来自用户本地选择 / 拖拽的新文件
 * - `url`：来自服务端回显 / CDN 已有图片，需跨域裁剪
 */
export type CropSource =
  | { type: 'file'; file: File }
  | { type: 'url'; url: string; name: string; mimeType: string }

export interface FileValidation {
  /** 允许的文件类型，支持 MIME type 或扩展名，如 'image/*' 或 ['.jpg','.png'] */
  accept?: string | string[]
  /** 最大文件体积（字节） */
  maxSize?: number
  /** 最小文件体积（字节） */
  minSize?: number
  /** 最多可上传文件数，为 1 时启用单文件（替换）模式 */
  maxFiles?: number
  /** 自定义验证函数，返回错误信息字符串或 null */
  validate?: (file: File) => string | null
}

export type UploadFn = (
  file: File,
  options: { onProgress?: (progress: number) => void }
) => Promise<string>

export interface FileUploadProps {
  /** 受控模式：当前已上传文件的 URL（单文件为 string，多文件为 string[]） */
  value?: string | string[]
  /** 非受控模式：初始值 */
  defaultValue?: string | string[]
  /** 受控模式变更回调 */
  onChange?: (value: string | string[]) => void
  validation?: FileValidation
  view?: FileView
  cardSize?: CardSize
  /** 上传区域变体风格 */
  variant?: FileVariant
  /** 上传函数，不传则只做本地预览（不触发上传） */
  upload?: UploadFn
  /** 是否开启图片裁剪（必须是 image/* 类型） */
  crop?: boolean
  /** 裁剪比例，不传则初始为自由比例 */
  aspect?: number
  disabled?: boolean
  className?: string
  onFileAccept?: (file: File) => void
  onFileReject?: (file: File, reason: string) => void
  onUploadStart?: (file: File) => void
  onUploadProgress?: (file: File, progress: number) => void
  onUploadSuccess?: (file: File, url: string) => void
  onUploadError?: (file: File, error: Error) => void
  children?: React.ReactNode
}
