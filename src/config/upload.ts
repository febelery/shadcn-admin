/**
 * 项目全局文件上传配置
 */
import { getQiniuUptoken } from '@/api/qiniu'
import type { UploadFn } from '@/components/file-upload'

/** 七牛云上传区域（z0=华东、z1=华北、z2=华南、na0=北美、as0=东南亚） */
export const QINIU_REGION = 'z2' as const

interface QiniuConfig {
  getToken: (file: File) => Promise<string>
  region?: string
  uploadUrl?: string
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

function createQiniuUpload(config: QiniuConfig): UploadFn {
  return async (file, { onProgress } = {}) => {
    const key = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const uploadUrl = resolveUploadUrl(config.region, config.uploadUrl)
    const token = await config.getToken(file)

    const formData = new FormData()
    formData.append('token', token)
    formData.append('file', file)
    formData.append('key', key)

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', uploadUrl, true)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText)
            resolve(res.path || res.key || key)
          } catch {
            reject(new Error('非法 JSON 响应'))
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText)
            reject(new Error(err.error || err.message || `HTTP ${xhr.status}`))
          } catch {
            reject(new Error(xhr.responseText || `HTTP ${xhr.status}`))
          }
        }
      }

      xhr.onerror = () => reject(new Error('网络错误'))
      xhr.onabort = () => reject(new Error('上传取消'))

      xhr.send(formData)
    })
  }
}

export const defaultUpload = createQiniuUpload({
  getToken: getQiniuUptoken,
  region: QINIU_REGION,
})
