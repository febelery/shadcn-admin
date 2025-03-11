// 定义文件类型枚举
export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  PDF = 'pdf',
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  OTHER = 'other',
}

// MIME类型与文件类型的映射
const mimeTypeMap: Record<string, FileType> = {
  'image/': FileType.IMAGE,
  'video/': FileType.VIDEO,
  'audio/': FileType.AUDIO,
  'application/pdf': FileType.PDF,
  'application/msword': FileType.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.wordprocessingml':
    FileType.DOCUMENT,
  'application/vnd.ms-excel': FileType.SPREADSHEET,
  'application/vnd.openxmlformats-officedocument.spreadsheetml':
    FileType.SPREADSHEET,
  'application/vnd.ms-powerpoint': FileType.PRESENTATION,
  'application/vnd.openxmlformats-officedocument.presentationml':
    FileType.PRESENTATION,
}

// 文件扩展名与文件类型的映射
const extensionMap: Record<string, FileType> = {
  // 图片
  jpg: FileType.IMAGE,
  jpeg: FileType.IMAGE,
  png: FileType.IMAGE,
  gif: FileType.IMAGE,
  webp: FileType.IMAGE,
  svg: FileType.IMAGE,
  bmp: FileType.IMAGE,
  // 视频
  mp4: FileType.VIDEO,
  webm: FileType.VIDEO,
  ogg: FileType.VIDEO,
  mov: FileType.VIDEO,
  avi: FileType.VIDEO,
  mkv: FileType.VIDEO,
  // 音频
  mp3: FileType.AUDIO,
  wav: FileType.AUDIO,
  flac: FileType.AUDIO,
  aac: FileType.AUDIO,
  // 文档
  pdf: FileType.PDF,
  doc: FileType.DOCUMENT,
  docx: FileType.DOCUMENT,
  txt: FileType.DOCUMENT,
  rtf: FileType.DOCUMENT,
  // 表格
  xls: FileType.SPREADSHEET,
  xlsx: FileType.SPREADSHEET,
  csv: FileType.SPREADSHEET,
  // 演示文稿
  ppt: FileType.PRESENTATION,
  pptx: FileType.PRESENTATION,
}

// 添加文件类型对应的 MIME 类型映射
export const FileTypeMimeMap: Record<FileType, string[]> = {
  [FileType.IMAGE]: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
  ],
  [FileType.VIDEO]: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
  ],
  [FileType.AUDIO]: [
    'audio/mpeg',
    'audio/wav',
    'audio/flac',
    'audio/aac',
    'audio/ogg',
  ],
  [FileType.PDF]: ['application/pdf'],
  [FileType.DOCUMENT]: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf',
  ],
  [FileType.SPREADSHEET]: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ],
  [FileType.PRESENTATION]: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  [FileType.OTHER]: ['*/*'],
}

/**
 * 获取文件类型
 * @param file 文件对象或文件信息
 * @returns 文件类型枚举值
 */
export function getFileType(file: { type: string; name: string }): FileType {
  const { type, name } = file

  // 先通过MIME类型判断
  for (const [mimePrefix, fileType] of Object.entries(mimeTypeMap)) {
    if (type === mimePrefix || type.startsWith(mimePrefix)) {
      return fileType
    }
  }

  // 如果MIME类型无法判断，则通过文件扩展名判断
  const extension = name.split('.').pop()?.toLowerCase()
  if (extension && extension in extensionMap) {
    return extensionMap[extension]
  }

  // 无法识别的文件类型
  return FileType.OTHER
}

/**
 * 检查文件是否为特定类型
 * @param file 文件对象或文件信息
 * @param fileType 要检查的文件类型
 * @returns 是否为指定的文件类型
 */
export function isFileType(
  file: { type: string; name: string },
  fileType: FileType
): boolean {
  return getFileType(file) === fileType
}

/**
 * 获取文件大小的可读形式
 * @param bytes 文件大小（字节）
 * @returns 格式化后的文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 获取文件类型的 accept 字符串
 * @param types 文件类型数组
 * @returns accept 字符串
 */
export function getAcceptFromFileTypes(types?: FileType[]): string {
  if (!types || types.length === 0) return '*/*'
  return types.flatMap((type) => FileTypeMimeMap[type]).join(',')
}
