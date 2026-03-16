import type { QiniuConfig } from './types'

interface QiniuUploadOptions {
  onProgress?: (progress: number) => void
  onSuccess?: (res: unknown) => void
  onError?: (err: string) => void
}

export function useQiniuUpload() {
  const uploadToQiniu = async (
    file: File,
    token: string,
    config: QiniuConfig,
    options: QiniuUploadOptions = {}
  ): Promise<string> => {
    const { onProgress, onSuccess, onError } = options
    const key = generateKey(file)
    const uploadUrl = resolveUploadUrl(config.region, config.uploadUrl)

    const formData = new FormData()
    formData.append('token', token)
    formData.append('file', file)
    formData.append('key', key)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', uploadUrl, true)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

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
          handleError(xhr.responseText || `HTTP ${xhr.status}`, onError, reject)
        }
      }

      xhr.onerror = () => handleError('network error', onError, reject)
      xhr.onabort = () => handleError('user canceled', onError, reject)

      xhr.send(formData)
    })
  }

  const uploadFile = async (
    file: File,
    config: QiniuConfig,
    options: QiniuUploadOptions = {}
  ): Promise<string> => {
    try {
      const token = await config.getToken(file)
      if (!token) throw new Error('bad token')
      return await uploadToQiniu(file, token, config, options)
    } catch (error) {
      const msg = translateError(error)
      options.onError?.(msg)
      throw new Error(msg)
    }
  }

  return { uploadFile, uploadToQiniu }
}

function generateKey(file: File): string {
  return `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
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

function handleSuccess(
  responseText: string,
  fallbackKey: string,
  onSuccess: ((res: unknown) => void) | undefined,
  resolve: (url: string) => void,
  reject: (err: Error) => void,
  onError: ((err: string) => void) | undefined
) {
  const response = safeParseJSON(responseText)
  if (!response)
    return handleError(responseText || '非 JSON 响应', onError, reject)

  const fileUrl =
    (response.path as string) || (response.key as string) || fallbackKey
  if (!fileUrl) return handleError('未找到文件 URL', onError, reject)

  onSuccess?.(response)
  resolve(fileUrl)
}

function handleError(
  error: string | Error,
  onError: ((err: string) => void) | undefined,
  reject: (err: Error) => void
) {
  const msg = translateError(error)
  onError?.(msg)
  reject(new Error(msg))
}

function safeParseJSON(text: string): Record<string, unknown> | null {
  if (!text?.trim().startsWith('{') && !text?.trim().startsWith('['))
    return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const ERROR_MAP: Record<string, string> = {
  'file exists': '文件已存在',
  'bad token': '上传凭证无效',
  'file too large': '文件大小超出限制',
  'invalid file type': '不支持的文件类型',
  'bucket not exist': '存储空间不存在',
  'file type not allowed': '文件类型不允许',
  'token expired': '上传凭证已过期',
  'user canceled': '用户取消上传',
  'network error': '网络连接错误',
}

function translateError(error: unknown): string {
  if (error instanceof Error) return ERROR_MAP[error.message] ?? error.message
  if (typeof error === 'string') {
    const parsed = safeParseJSON(error)
    if (parsed) {
      const key = String(parsed.error ?? parsed.message ?? error)
      return ERROR_MAP[key] ?? key
    }
    return ERROR_MAP[error] ?? error
  }
  return '未知错误'
}
