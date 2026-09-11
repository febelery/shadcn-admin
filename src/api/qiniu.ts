/**
 * 七牛云上传相关 API
 */
import axios from 'axios'
import type { UploadFn } from '@/context/upload-provider'

export interface QiniuUptokenRequest {
  name: string
  size: number
  type: string
  modified: number
}

export interface QiniuUptokenResponse {
  uptoken: string
}

/**
 * 获取七牛上传 token
 */
export async function getQiniuUptoken(file: File): Promise<string> {
  const response = await axios.post<QiniuUptokenResponse>(
    '/api/qiniu/uptoken',
    {
      name: file.name,
      size: file.size,
      type: file.type,
      modified: file.lastModified,
    } satisfies QiniuUptokenRequest
  )

  return response.data.uptoken
}

/** 七牛云上传区域（z0=华东、z1=华北、z2=华南、na0=北美、as0=东南亚） */
export const QINIU_REGION = 'z2' as const

export interface QiniuConfig {
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

/**
 * 创建七牛云上传适配器（满足全站 UploadFn 标准签名）
 */
export function createQiniuUpload(config: QiniuConfig): UploadFn {
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

/** 全局七牛云上传适配器默认实例 */
export const qiniuUpload = createQiniuUpload({
  getToken: getQiniuUptoken,
  region: QINIU_REGION,
})
