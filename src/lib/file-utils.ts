/**
 * 文件处理工具函数
 * 包含文件类型识别、验证、格式化等功能
 */
import type { FileItem, FileValidation } from '@/components/file-upload/types'

/**
 * 验证文件类型
 */
export function validateFileType(
  file: File,
  accept?: string | string[]
): string | null {
  if (!accept) return null

  const accepts = Array.isArray(accept) ? accept : [accept]
  const fileType = file.type
  const fileName = file.name.toLowerCase()
  const fileExtension = `.${fileName.split('.').pop()}`

  for (const pattern of accepts) {
    // 精确匹配MIME类型
    if (pattern === fileType) return null

    // 匹配扩展名
    if (pattern === fileExtension) return null

    // 匹配通配符模式，如 'image/*'
    if (pattern.includes('/*')) {
      const baseType = pattern.replace('/*', '')
      if (fileType.startsWith(`${baseType}/`)) return null
    }

    // 匹配MIME类型前缀，如 'image'
    if (fileType.startsWith(`${pattern}/`)) return null
  }

  return '文件类型不被接受'
}

/**
 * 验证文件大小
 */
export function validateFileSize(
  file: File,
  maxSize?: number,
  minSize?: number
): string | null {
  if (maxSize && file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2)
    return `文件大小不能超过 ${maxSizeMB}MB`
  }

  if (minSize && file.size < minSize) {
    const minSizeMB = (minSize / (1024 * 1024)).toFixed(2)
    return `文件大小不能小于 ${minSizeMB}MB`
  }

  return null
}

/**
 * 验证文件
 */
export function validateFile(
  file: File,
  rule: FileValidation
): string | null {
  // 自定义验证
  if (rule.validate) {
    const error = rule.validate(file)
    if (error) return error
  }

  // 类型验证
  const typeError = validateFileType(file, rule.accept)
  if (typeError) return typeError

  // 大小验证
  const sizeError = validateFileSize(file, rule.maxSize, rule.minSize)
  if (sizeError) return sizeError

  return null
}

/**
 * 格式化文件大小
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${sizes[i]}`
}

/**
 * 文件类型常量定义
 */
const FILE_EXTENSIONS = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
  video: ['mp4', 'webm', 'ogv', 'mov', 'avi', 'mkv'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac'],
  word: ['doc', 'docx'],
  excel: ['xls', 'xlsx', 'csv'],
  powerpoint: ['ppt', 'pptx'],
  code: [
    'html',
    'css',
    'js',
    'jsx',
    'ts',
    'tsx',
    'json',
    'xml',
    'php',
    'py',
    'rb',
    'java',
    'c',
    'cpp',
    'cs',
    'go',
    'rs',
    'swift',
    'kt',
  ],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
  application: ['exe', 'msi', 'app', 'apk', 'deb', 'rpm'],
  text: ['txt', 'md', 'rtf'],
} as const

const MIME_TYPES = {
  word: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  excel: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  powerpoint: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  pdf: ['application/pdf'],
} as const

/**
 * 从扩展名识别文件类型
 */
function getFileTypeFromExtension(extension: string): string {
  if (!extension) return 'file'

  // 图片
  if (FILE_EXTENSIONS.image.includes(extension as any)) return 'image'
  // 视频
  if (FILE_EXTENSIONS.video.includes(extension as any)) return 'video'
  // 音频
  if (FILE_EXTENSIONS.audio.includes(extension as any)) return 'audio'
  // Word
  if (FILE_EXTENSIONS.word.includes(extension as any)) return 'word'
  // Excel
  if (FILE_EXTENSIONS.excel.includes(extension as any)) return 'excel'
  // PowerPoint
  if (FILE_EXTENSIONS.powerpoint.includes(extension as any)) return 'powerpoint'
  // PDF
  if (extension === 'pdf') return 'pdf'
  // 代码文件
  if (FILE_EXTENSIONS.code.includes(extension as any)) return 'code'
  // 压缩包
  if (FILE_EXTENSIONS.archive.includes(extension as any)) return 'archive'
  // 应用程序
  if (FILE_EXTENSIONS.application.includes(extension as any))
    return 'application'
  // 文本文件
  if (FILE_EXTENSIONS.text.includes(extension as any)) return 'text'

  return 'file'
}

/**
 * 从 MIME 类型识别文件类型
 */
function getFileTypeFromMime(mimeType: string, extension: string): string {
  // 图片
  if (mimeType.startsWith('image/')) return 'image'
  // 视频
  if (mimeType.startsWith('video/')) return 'video'
  // 音频
  if (mimeType.startsWith('audio/')) return 'audio'
  // Word
  if (
    MIME_TYPES.word.includes(mimeType as any) ||
    FILE_EXTENSIONS.word.includes(extension as any)
  )
    return 'word'
  // Excel
  if (
    MIME_TYPES.excel.includes(mimeType as any) ||
    FILE_EXTENSIONS.excel.includes(extension as any)
  )
    return 'excel'
  // PowerPoint
  if (
    MIME_TYPES.powerpoint.includes(mimeType as any) ||
    FILE_EXTENSIONS.powerpoint.includes(extension as any)
  )
    return 'powerpoint'
  // PDF
  if (MIME_TYPES.pdf.includes(mimeType as any) || extension === 'pdf')
    return 'pdf'
  // 文本文件
  if (
    mimeType.startsWith('text/') ||
    FILE_EXTENSIONS.text.includes(extension as any)
  )
    return 'text'
  // 代码文件
  if (FILE_EXTENSIONS.code.includes(extension as any)) return 'code'
  // 压缩包
  if (FILE_EXTENSIONS.archive.includes(extension as any)) return 'archive'
  // 应用程序
  if (
    FILE_EXTENSIONS.application.includes(extension as any) ||
    mimeType.startsWith('application/')
  )
    return 'application'

  return 'file'
}

/**
 * 获取文件图标类型（从 File 对象）
 */
export function getFileIconType(file: File): string {
  const mimeType = file.type
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return getFileTypeFromMime(mimeType, extension)
}

/**
 * 从 URL 获取文件类型
 */
export function getFileTypeFromUrl(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase() ?? ''
  return getFileTypeFromExtension(extension)
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * 创建文件项
 */
export function createFileItem(file: File): FileItem {
  return {
    id: generateId(),
    file,
    progress: 0,
    status: 'idle',
  }
}

/**
 * 从 URL 提取文件名
 */
export function getFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const fileName = pathname.split('/').pop() || '已上传文件'
    return decodeURIComponent(fileName)
  } catch {
    const fileName = url.split('/').pop() || '已上传文件'
    return decodeURIComponent(fileName)
  }
}
