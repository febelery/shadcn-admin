/**
 * 文件上传工具函数
 */

import type {
  FileUploadValidationRule,
  FileUploadItem,
} from '@/types/file-upload'

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
  rule: FileUploadValidationRule
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
 * 获取文件图标类型
 */
export function getFileIconType(file: File): string {
  const type = file.type
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (type.startsWith('video/')) return 'video'
  if (type.startsWith('audio/')) return 'audio'
  if (type.startsWith('image/')) return 'image'
  if (
    type.startsWith('text/') ||
    ['txt', 'md', 'rtf', 'pdf'].includes(extension)
  )
    return 'text'
  if (
    [
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
    ].includes(extension)
  )
    return 'code'
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension))
    return 'archive'
  if (
    ['exe', 'msi', 'app', 'apk', 'deb', 'rpm'].includes(extension) ||
    type.startsWith('application/')
  )
    return 'application'

  return 'file'
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
export function createFileItem(file: File): FileUploadItem {
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
