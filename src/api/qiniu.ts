/**
 * 七牛云上传相关 API
 */
import axios from 'axios'

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
export async function getQiniuUptoken(
  file: File
): Promise<string> {
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

