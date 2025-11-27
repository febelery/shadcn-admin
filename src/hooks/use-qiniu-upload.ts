/**
 * 七牛云上传 Hook
 */
import type { QiniuUploadConfig, QiniuUploadOptions } from '@/types/file-upload'

// 错误信息映射
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

/**
 * 安全解析JSON
 */
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

/**
 * 获取翻译后的错误信息
 */
function getTranslatedError(error: string | Error): string {
  if (error instanceof Error) {
    return ERROR_MESSAGES[error.message] || error.message
  }

  // 如果是字符串
  if (typeof error === 'string') {
    const parsed = safeParseJSON(error)
    if (parsed) {
      const errorKey = parsed.error || parsed.message || error
      return ERROR_MESSAGES[errorKey] || errorKey || error
    }

    // 直接查找错误信息映射
    return ERROR_MESSAGES[error] || error
  }

  return '未知错误'
}

/**
 * 获取七牛上传接口地址
 */
function getUploadUrl(region?: string, customUrl?: string): string {
  if (customUrl) {
    return customUrl
  }

  // 根据区域选择上传地址
  const regionMap: Record<string, string> = {
    z0: 'https://up-z0.qiniup.com',
    z1: 'https://up-z1.qiniup.com',
    z2: 'https://up-z2.qiniup.com',
    na0: 'https://up-na0.qiniup.com',
    as0: 'https://up-as0.qiniup.com',
  }

  return regionMap[region || 'z0'] || 'https://up-z0.qiniup.com'
}

/**
 * 七牛云上传 Hook
 */
export function useQiniuUpload() {
  const uploadToQiniu = async (
    file: File,
    token: string,
    config: QiniuUploadConfig,
    options: QiniuUploadOptions = {}
  ): Promise<string> => {
    const { onProgress, onSuccess, onError } = options

    const formData = new FormData()
    formData.append('token', token)
    formData.append('file', file)

    // 可选：添加文件key
    const key = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    formData.append('key', key)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const uploadUrl = getUploadUrl(config.region, config.uploadUrl)

      xhr.open('POST', uploadUrl, true)

      // 上传进度
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress(progress)
        }
      }

      // 上传完成
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const responseText = xhr.responseText

          // 安全解析JSON
          const response = safeParseJSON(responseText)
          if (!response) {
            const error = getTranslatedError(
              responseText || '服务器返回了非JSON格式的响应'
            )
            onError?.(error)
            reject(new Error(error))
            return
          }

          // 优先使用 path 字段（完整的 URL），如果没有则使用 key
          const fileUrl = response.path || response.key || key
          if (!fileUrl) {
            const error = '上传响应中未找到文件 URL 或标识'
            onError?.(error)
            reject(new Error(error))
            return
          }

          onSuccess?.(response)
          resolve(fileUrl)
        } else {
          // 非200状态码
          const responseText = xhr.responseText || ''
          const errorMessage =
            getTranslatedError(responseText) ||
            `上传失败 (状态码: ${xhr.status})`
          onError?.(errorMessage)
          reject(new Error(errorMessage))
        }
      }

      // 上传错误
      xhr.onerror = () => {
        const error = getTranslatedError('network error')
        onError?.(error)
        reject(new Error(error))
      }

      // 上传中止
      xhr.onabort = () => {
        const error = getTranslatedError('user canceled')
        onError?.(error)
        reject(new Error(error))
      }

      xhr.send(formData)
    })
  }

  /**
   * 上传文件到七牛
   */
  const uploadFile = async (
    file: File,
    config: QiniuUploadConfig,
    options: QiniuUploadOptions = {}
  ): Promise<string> => {
    try {
      // 获取上传token
      const token = await config.getToken(file)

      if (!token) {
        const error = getTranslatedError('bad token')
        options.onError?.(error)
        throw new Error(error)
      }

      // 上传文件
      return await uploadToQiniu(file, token, config, options)
    } catch (error: any) {
      const errorMessage = getTranslatedError(error)
      options.onError?.(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return { uploadFile, uploadToQiniu }
}
