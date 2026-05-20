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
