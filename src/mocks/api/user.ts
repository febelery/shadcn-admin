import { http, HttpResponse } from 'msw'
import { buildMockApiUrl } from '@/lib/utils'

export default [
  http.post(buildMockApiUrl('/auth/admin'), async ({ request }) => {
    const { username, password } = (await request.json()) as any

    if (username !== 'admin' || password !== 'admin.123') {
      return HttpResponse.json(
        {
          status: 400,
          message: '用户名或密码错误',
        },
        {
          status: 400,
        }
      )
    }

    return HttpResponse.json(
      {
        avatar: 'https://wximg.chuanbaoguancha.cn/FiTobW1ALPNQB8NfnK_bGCx-onth',
        expire_at: 1731989664,
        name: 'Ross',
        nickname: 'Ross',
        need_otp: true,
        otp_key: '1234567890',
        token: 'through_token',
      },
      {
        status: 200,
      }
    )
  }),

  http.post(buildMockApiUrl('/auth/admin/otp'), () => {
    if (Math.random() < 0.5) {
      return HttpResponse.json(
        {
          status: 400,
          message: '二次验证失败',
        },
        {
          status: 400,
        }
      )
    }

    return HttpResponse.json(
      {
        avatar: 'https://wximg.chuanbaoguancha.cn/FiTobW1ALPNQB8NfnK_bGCx-onth',
        expire_at: 1731989664,
        name: 'Ross',
        nickname: 'Ross',
        token: 'through_token',
      },
      {
        status: 200,
      }
    )
  }),

  http.get(buildMockApiUrl('/user/info'), ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          status: 401,
          message: '未授权访问',
        },
        {
          status: 401,
        }
      )
    }

    const token = authHeader.split(' ')[1]
    if (token !== 'through_token') {
      return HttpResponse.json(
        {
          status: 401,
          message: '无效的访问令牌',
        },
        {
          status: 401,
        }
      )
    }

    return HttpResponse.json(
      {
        name: 'Ross',
        nickname: 'Ross',
        provider: 'admin',
        avatar: 'https://wximg.chuanbaoguancha.cn/FiTobW1ALPNQB8NfnK_bGCx-onth',
        created_at: '2024-02-19 10:55:05',
      },
      {
        status: 200,
      }
    )
  }),
]
