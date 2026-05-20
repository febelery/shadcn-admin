import { getMimeTypeFromExtension } from '@/lib/utils'
import type { MediaKind } from './media'
import { getMediaDefaultExtension, getMediaDefaultMime } from './media'

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
    type = getMediaDefaultMime(mediaKind)
    if (!/\.\w+$/.test(name)) {
      name = `${name}.${getMediaDefaultExtension(mediaKind)}`
    }
  }

  return new File([], name, { type })
}
