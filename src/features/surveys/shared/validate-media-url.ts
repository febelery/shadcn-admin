/** 校验媒体资源外链（http/https），图/视频/音频通用 */
export function validateMediaUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '仅支持 http 或 https 链接'
    }
    return null
  } catch {
    return '请输入有效的媒体地址'
  }
}
