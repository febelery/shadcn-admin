/**
 * 文件上传组件类型定义
 */

export type FileUploadView = 'list' | 'card'

export type FileUploadCardSize = 'sm' | 'lg' | 'full'

export type FileUploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export interface FileUploadItem {
  id: string
  file: File
  url?: string // 上传成功后的URL
  progress: number
  status: FileUploadStatus
  error?: string
  // 标识是否来自上传操作（用于区分回显和实际上传）
  isFromUpload?: boolean
}

export interface FileUploadValidationRule {
  // 文件类型验证
  accept?: string | string[] // MIME类型或扩展名，如 'image/*' 或 ['.jpg', '.png']
  // 文件大小限制（字节）
  maxSize?: number
  minSize?: number
  // 文件数量限制
  maxFiles?: number
  minFiles?: number
  // 自定义验证函数
  validate?: (file: File) => string | null | undefined
}

export interface QiniuUploadConfig {
  // 七牛上传token获取接口
  getToken: (file: File) => Promise<string>
  // 上传区域（可选）
  region?: string
  // 上传接口地址（可选，默认根据region选择）
  uploadUrl?: string
}

export interface QiniuUploadOptions {
  onProgress?: (progress: number) => void
  onSuccess?: (response: any) => void
  onError?: (error: string) => void
}

/**
 * 上传函数接口（抽象层）
 * 高层模块依赖此接口，不依赖具体实现
 */
export type UploadFunction = (
  file: File,
  options: {
    onProgress?: (progress: number) => void
  }
) => Promise<string>

export interface FileUploadProps {
  // 值：单个文件返回字符串，多个文件返回数组
  value?: string | string[]
  defaultValue?: string | string[]
  onChange?: (value: string | string[]) => void
  // 验证规则（maxFiles=1 表示单文件模式，否则为多文件模式）
  validation?: FileUploadValidationRule
  // 视图模式
  view?: FileUploadView
  // 卡片尺寸（仅在 view='card' 时生效）
  cardSize?: FileUploadCardSize
  // 上传配置：可以是上传函数（抽象接口）或七牛配置（自动转换）
  upload?: UploadFunction | QiniuUploadConfig
  // 禁用
  disabled?: boolean
  // 自定义类名
  className?: string
  // 文件接受回调
  onFileAccept?: (file: File) => void
  // 文件拒绝回调
  onFileReject?: (file: File, reason: string) => void
  // 上传开始回调
  onUploadStart?: (file: File) => void
  // 上传进度回调
  onUploadProgress?: (file: File, progress: number) => void
  // 上传成功回调
  onUploadSuccess?: (file: File, url: string) => void
  // 上传失败回调
  onUploadError?: (file: File, error: Error) => void
}
