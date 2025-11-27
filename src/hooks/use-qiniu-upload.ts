/**
 * 七牛云上传 Hook
 */
import type { QiniuUploadConfig, QiniuUploadOptions } from '@/types/file-upload'

/**
 * 七牛云上传 Hook
 * 提供上传文件到七牛云的功能
 */
export function useQiniuUpload() {
  /**
   * 上传文件到七牛 (底层实现)
   */
  const uploadToQiniu = async (
    file: File,
    token: string,
    config: QiniuUploadConfig,
    options: QiniuUploadOptions = {}
  ): Promise<string> => {
    const { onProgress, onSuccess, onError } = options
    const key = generateFileKey(file)
    const uploadUrl = getUploadUrl(config.region, config.uploadUrl)

    const formData = new FormData()
    formData.append('token', token)
    formData.append('file', file)
    formData.append('key', key)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', uploadUrl, true)

      // 进度监听
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress(progress)
        }
      }

      // 完成处理
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          handleSuccess(
            xhr.responseText,
            key,
            onSuccess,
            resolve,
            reject,
            onError
          )
        } else {
          handleError(
            xhr.responseText || `状态码: ${xhr.status}`,
            onError,
            reject
          )
        }
      }

      // 错误处理
      xhr.onerror = () => handleError('network error', onError, reject)
      xhr.onabort = () => handleError('user canceled', onError, reject)

      xhr.send(formData)
    })
  }

  /**
   * 上传文件 (包含获取 Token)
   */
  const uploadFile = async (
    file: File,
    config: QiniuUploadConfig,
    options: QiniuUploadOptions = {}
  ): Promise<string> => {
    try {
      const token = await config.getToken(file)
      if (!token) throw new Error('bad token')
      return await uploadToQiniu(file, token, config, options)
    } catch (error: any) {
      const msg = getTranslatedError(error)
      options.onError?.(msg)
      throw new Error(msg)
    }
  }

  return { uploadFile, uploadToQiniu }
}

function generateFileKey(file: File): string {
  return `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
}

function handleSuccess(
  responseText: string,
  fallbackKey: string,
  onSuccess: ((res: any) => void) | undefined,
  resolve: (url: string) => void,
  reject: (err: Error) => void,
  onError: ((err: string) => void) | undefined
) {
  const response = safeParseJSON(responseText)
  if (!response) {
    return handleError(responseText || '非 JSON 响应', onError, reject)
  }

  const fileUrl = response.path || response.key || fallbackKey
  if (!fileUrl) {
    return handleError('未找到文件 URL', onError, reject)
  }

  onSuccess?.(response)
  resolve(fileUrl)
}

function handleError(
  error: string | Error,
  onError: ((err: string) => void) | undefined,
  reject: (err: Error) => void
) {
  const msg = getTranslatedError(error)
  onError?.(msg)
  reject(new Error(msg))
}

function getUploadUrl(region?: string, customUrl?: string): string {
  if (customUrl) return customUrl
  const regionMap: Record<string, string> = {
    z0: 'https://up-z0.qiniup.com',
    z1: 'https://up-z1.qiniup.com',
    z2: 'https://up-z2.qiniup.com',
    na0: 'https://up-na0.qiniup.com',
    as0: 'https://up-as0.qiniup.com',
  }
  return regionMap[region || 'z0'] || 'https://up-z0.qiniup.com'
}

function safeParseJSON(text: string): any | null {
  if (!text || typeof text !== 'string') return null
  const trimmed = text.trim()
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
    return null
  }
  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  'file exists': '文件已存在',
  'bad token': '上传凭证无效',
  'file too large': '文件大小超出限制',
  'invalid file type': '不支持的文件类型',
  'bucket not exist': '存储空间不存在',
  'file type not allowed': '文件类型不允许',
  'token expired': '上传凭证已过期',
  'user canceled': '用户取消上传',
  'network error': '网络连接错误',
  'upload failed': '上传失败',
  'parse error': '解析响应失败',
}

function getTranslatedError(error: string | Error): string {
  if (error instanceof Error) {
    return ERROR_MESSAGES[error.message] || error.message
  }
  if (typeof error === 'string') {
    const parsed = safeParseJSON(error)
    if (parsed) {
      const key = parsed.error || parsed.message || error
      return ERROR_MESSAGES[key] || key || error
    }
    return ERROR_MESSAGES[error] || error
  }
  return '未知错误'
}
