import { http, HttpResponse } from 'msw'

/**
 * 七牛云上传 Token Mock Handler
 */
export const qiniuHandlers = [
  // 获取七牛上传 token
  http.post('/api/qiniu/uptoken', async ({ request }) => {
    try {
      const body = (await request.json()) as {
        name?: string
        size?: number
        type?: string
        modified?: number
      }

      // 如果文件过大，返回 400
      if (body.size && body.size > 100 * 1024 * 1024) {
        // 100MB
        return new HttpResponse(JSON.stringify({ error: 'file too large' }), {
          status: 400,
          statusText: 'Bad Request',
        })
      }

      // 模拟 token 生成
      const mockToken = `mock-uptoken-${Date.now()}-${Math.random().toString(36).substring(7)}`

      return HttpResponse.json({
        uptoken: mockToken,
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // 解析错误，返回 400
      return new HttpResponse(JSON.stringify({ error: 'invalid request' }), {
        status: 400,
        statusText: 'Bad Request',
      })
    }
  }),
]
