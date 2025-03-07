import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const buildMockApiUrl = (path: string) => {
  return `${import.meta.env.VITE_API_BASE_URL}${path}`
}

export type FileType =
  | 'image'
  | 'video'
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'audio'
  | 'archive'
  | 'text'
  | 'unknown'

const FILE_EXTENSION_MAP: Record<FileType, string[]> = {
  image: [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'webp',
    'heif',
    'heic',
    'svg',
    'ico',
  ],
  video: [
    'mp4',
    'webm',
    'ogg',
    'mov',
    'avi',
    'flv',
    'wmv',
    'mkv',
    '3gp',
    'm4v',
  ],
  pdf: ['pdf'],
  word: ['doc', 'docx', 'rtf'],
  excel: ['xls', 'xlsx', 'csv'],
  powerpoint: ['ppt', 'pptx'],
  audio: ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac', 'wma'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
  text: ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts'],
  unknown: [],
}

const EXTENSION_TO_TYPE = Object.entries(FILE_EXTENSION_MAP).reduce(
  (acc, [type, extensions]) => {
    extensions.forEach((ext) => {
      acc[ext] = type as FileType
    })
    return acc
  },
  {} as Record<string, FileType>
)

export const getUrlType = (url: string): FileType => {
  try {
    const pathname = new URL(url).pathname
    const extensionMatch = pathname.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/)
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : ''

    return EXTENSION_TO_TYPE[extension] || 'unknown'
  } catch {
    return 'unknown'
  }
}

// 通用的上传相关工具函数
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const fetchWithRetries = async (
  url: string,
  maxRetries = 6,
  baseDelay = 1000
) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response
    } catch (error) {
      if (attempt === maxRetries - 1) throw error
      await sleep(baseDelay * Math.pow(2, attempt))
    }
  }
  throw new Error('Fetch failed after retries')
}
