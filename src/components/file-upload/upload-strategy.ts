/**
 * 上传策略模式定义
 */
import type { QiniuConfig } from './types'

export interface UploadResult {
  url: string
  key?: string
  [key: string]: unknown
}

export interface UploadOptions {
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

export interface UploadStrategy {
  upload: (file: File, options?: UploadOptions) => Promise<UploadResult>
}

/**
 * 七牛云上传策略工厂
 */
export function createQiniuStrategy(config: QiniuConfig): UploadStrategy {
  return {
    upload: async (file: File, options: UploadOptions = {}) => {
      const key = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const uploadUrl = resolveUploadUrl(config.region, config.uploadUrl)
      const token = await config.getToken(file)

      const formData = new FormData()
      formData.append('token', token)
      formData.append('file', file)
      formData.append('key', key)

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', uploadUrl, true)

        if (options.signal) {
          options.signal.addEventListener('abort', () => xhr.abort())
        }

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && options.onProgress) {
            options.onProgress(Math.round((e.loaded / e.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText)
              const url = res.path || res.key || key
              resolve({ url, ...res })
            } catch {
              reject(new Error('非法 JSON 响应'))
            }
          } else {
            // 尝试解析错误响应中的 error 字段
            try {
              const errData = JSON.parse(xhr.responseText)
              reject(new Error(errData.error || errData.message || `HTTP ${xhr.status}`))
            } catch {
              reject(new Error(xhr.responseText || `HTTP ${xhr.status}`))
            }
          }
        }

        xhr.onerror = () => reject(new Error('网络错误'))
        xhr.onabort = () => reject(new Error('上传取消'))

        xhr.send(formData)
      })
    },
  }
}

function resolveUploadUrl(region?: string, customUrl?: string): string {
  if (customUrl) return customUrl
  const map: Record<string, string> = {
    z0: 'https://up-z0.qiniup.com',
    z1: 'https://up-z1.qiniup.com',
    z2: 'https://up-z2.qiniup.com',
    na0: 'https://up-na0.qiniup.com',
    as0: 'https://up-as0.qiniup.com',
  }
  return map[region ?? 'z0'] ?? 'https://up-z0.qiniup.com'
}
