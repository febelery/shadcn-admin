import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const buildMockApiUrl = (path: string) => {
  return `${import.meta.env.VITE_API_BASE_URL}${path}`
}

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
      await new Promise((resolve) =>
        setTimeout(resolve, baseDelay * Math.pow(2, attempt))
      )
    }
  }
  throw new Error('Fetch failed after retries')
}

export const getMimeTypeFromUrl = (url: string): string => {
  // 去掉查询参数和锚点
  const cleanUrl = url.split('?')[0].split('#')[0]
  const extension = cleanUrl.split('.').pop()?.toLowerCase()

  const mimeTypes: { [key: string]: string } = {
    // 图片
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    // 视频
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    // 音频
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    // 文档
    pdf: 'application/pdf',
    txt: 'text/plain',
    html: 'text/html',
    htm: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    xml: 'application/xml',
    // Office 文件
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // 压缩包
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
  }

  if (extension && mimeTypes[extension]) {
    return mimeTypes[extension]
  }

  return 'application/octet-stream'
}
