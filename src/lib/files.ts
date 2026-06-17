import { getMimeTypeFromExtension } from '@/lib/utils'
import type { FileValidation } from '@/components/file-upload/types'

// ============================================================================
// 1. Kinds (文件大类推断)
// ============================================================================

/** 文件大类：用于图标、预览与 URL 推断 */
export type FileKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'text'
  | 'code'
  | 'archive'
  | 'application'
  | 'file'

type FileKindRule = {
  kind: Exclude<FileKind, 'file'>
  extensions?: readonly string[]
  mimePrefixes?: readonly string[]
  mimeTypes?: readonly string[]
}

/** 按优先级排列；先匹配先生效 */
const FILE_KIND_RULES: FileKindRule[] = [
  {
    kind: 'image',
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'],
    mimePrefixes: ['image/'],
  },
  {
    kind: 'video',
    extensions: ['mp4', 'webm', 'ogv', 'mov', 'm4v', 'avi', 'mkv'],
    mimePrefixes: ['video/'],
  },
  {
    kind: 'audio',
    extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'],
    mimePrefixes: ['audio/'],
  },
  {
    kind: 'word',
    extensions: ['doc', 'docx'],
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  {
    kind: 'excel',
    extensions: ['xls', 'xlsx', 'csv'],
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  {
    kind: 'powerpoint',
    extensions: ['ppt', 'pptx'],
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
  },
  {
    kind: 'pdf',
    extensions: ['pdf'],
    mimeTypes: ['application/pdf'],
  },
  {
    kind: 'text',
    extensions: ['txt', 'md', 'rtf'],
    mimePrefixes: ['text/'],
  },
  {
    kind: 'code',
    extensions: [
      'html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'php', 'py',
      'rb', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'swift', 'kt'
    ],
  },
  {
    kind: 'archive',
    extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
  },
  {
    kind: 'application',
    extensions: ['exe', 'msi', 'app', 'apk', 'deb', 'rpm'],
  },
]

function normalizeExtension(raw: string): string {
  return raw.replace(/^\./, '').toLowerCase()
}

function hasExtension(extension: string, list?: readonly string[]): boolean {
  if (!extension || !list?.length) return false
  return list.includes(extension)
}

function matchesMime(mimeType: string, rule: FileKindRule): boolean {
  if (rule.mimePrefixes?.some((prefix) => mimeType.startsWith(prefix))) {
    return true
  }
  return Boolean(rule.mimeTypes?.includes(mimeType))
}

function matchRule(
  rule: FileKindRule,
  mimeType: string,
  extension: string
): boolean {
  if (matchesMime(mimeType, rule)) return true
  return hasExtension(extension, rule.extensions)
}

/** 从扩展名推断文件大类 */
export function getFileKindFromExtension(extension: string): FileKind {
  const ext = normalizeExtension(extension)
  if (!ext) return 'file'

  for (const rule of FILE_KIND_RULES) {
    if (hasExtension(ext, rule.extensions)) return rule.kind
  }
  return 'file'
}

/** 从 MIME + 扩展名推断文件大类 */
export function getFileKindFromMime(
  mimeType: string,
  extension: string
): FileKind {
  const ext = normalizeExtension(extension)

  for (const rule of FILE_KIND_RULES) {
    if (rule.kind === 'application') continue
    if (matchRule(rule, mimeType, ext)) return rule.kind
  }

  const applicationRule = FILE_KIND_RULES.find(
    (rule) => rule.kind === 'application'
  )
  if (
    hasExtension(ext, applicationRule?.extensions) ||
    mimeType.startsWith('application/')
  ) {
    return 'application'
  }

  return 'file'
}

/** 从 File 对象推断文件大类 */
export function getFileKind(file: File): FileKind {
  const extension = file.name.split('.').pop() ?? ''
  return getFileKindFromMime(file.type, extension)
}

/** 从 URL 路径扩展名推断文件大类 */
export function getFileKindFromUrl(url: string): FileKind {
  const path = url.split(/[?#]/)[0] ?? url
  const extension = path.split('.').pop() ?? ''
  return getFileKindFromExtension(extension)
}

// ============================================================================
// 2. Format (字节大小格式化)
// ============================================================================

const KB = 1024
const MB = KB * KB

/** 将 MB 转换为字节 */
export function mbToBytes(mb: number): number {
  return mb * MB
}

/** 人类可读的文件体积 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / 1024 ** unitIndex
  return `${value.toFixed(unitIndex ? 1 : 0)} ${units[unitIndex]}`
}

// ============================================================================
// 3. Urls (解析 URL 获取占位文件)
// ============================================================================

/** 媒体大类：与 MIME 前缀 image | video | audio 对应 */
export type MediaKind = 'image' | 'video' | 'audio'

const DEFAULT_MEDIA_MIMES = {
  image: 'image/jpeg',
  video: 'video/mp4',
  audio: 'audio/mpeg',
} as const

const DEFAULT_MEDIA_EXTS = {
  image: 'jpg',
  video: 'mp4',
  audio: 'mp3',
} as const

/** 从 URL 提取文件名 */
export function getFileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const fileName = pathname.split('/').pop() || '已上传文件'
    return decodeURIComponent(fileName)
  } catch {
    const fileName = url.split('/').pop() || '已上传文件'
    return decodeURIComponent(fileName)
  }
}

/**
 * 由 URL 构造空壳 File，供 FileUpload 回显 / FileThumbnail 预览。
 * 当扩展名无法推断 MIME 时，可传入 mediaKind 补全。
 */
export function createPlaceholderFileFromUrl(
  url: string,
  mediaKind?: MediaKind
): File {
  let name = getFileNameFromUrl(url)
  let type = getMimeTypeFromExtension(name)

  if (type === 'application/octet-stream' && mediaKind) {
    type = DEFAULT_MEDIA_MIMES[mediaKind]
    if (!/\.\w+$/.test(name)) {
      name = `${name}.${DEFAULT_MEDIA_EXTS[mediaKind]}`
    }
  }

  return new File([], name, { type })
}

// ============================================================================
// 4. Validation (文件类型与大小校验)
// ============================================================================

function getFileExtension(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  return ext ? `.${ext}` : ''
}

function acceptsPattern(
  pattern: string,
  fileType: string,
  fileExtension: string
): boolean {
  if (pattern === fileType || pattern === fileExtension) return true

  if (pattern.includes('/*')) {
    const baseType = pattern.replace('/*', '')
    return fileType.startsWith(`${baseType}/`)
  }

  return fileType.startsWith(`${pattern}/`)
}

/** 校验文件类型；通过返回 null */
export function validateFileType(
  file: File,
  accept?: string | string[]
): string | null {
  if (!accept) return null

  const accepts = Array.isArray(accept) ? accept : [accept]
  const fileType = file.type
  const fileExtension = getFileExtension(file.name.toLowerCase())

  for (const pattern of accepts) {
    if (acceptsPattern(pattern, fileType, fileExtension)) return null
  }

  return '文件类型不被接受'
}

/** 校验文件体积；通过返回 null */
export function validateFileSize(
  file: File,
  maxSize?: number,
  minSize?: number
): string | null {
  if (maxSize && file.size > maxSize) {
    return `文件大小不能超过 ${(maxSize / MB).toFixed(2)}MB`
  }

  if (minSize && file.size < minSize) {
    return `文件大小不能小于 ${(minSize / MB).toFixed(2)}MB`
  }

  return null
}

/** 按规则校验文件；通过返回 null */
export function validateFile(file: File, rule: FileValidation): string | null {
  if (rule.validate) {
    const customError = rule.validate(file)
    if (customError) return customError
  }

  const typeError = validateFileType(file, rule.accept)
  if (typeError) return typeError

  return validateFileSize(file, rule.maxSize, rule.minSize)
}
