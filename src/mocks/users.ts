import { http, HttpResponse } from "msw";

export const buildMockApiUrl = (path: string) => {
  return `${import.meta.env.VITE_API_BASE_URL}${path}`;
};

const users = [
  http.post(buildMockApiUrl("/auth/admin"), async ({ request }) => {
    const { username, password } = (await request.json()) as any;

    if (username !== "admin" || password !== "admin.123") {
      return HttpResponse.json(
        {
          status: 400,
          message: "用户名或密码错误",
        },
        {
          status: 400,
        }
      );
    }

    return HttpResponse.json(
      {
        avatar: "https://wximg.chuanbaoguancha.cn/FiTobW1ALPNQB8NfnK_bGCx-onth",
        expire_at: 1731989664,
        name: "Ross",
        nickname: "Ross",
        need_two_factor: true,
        two_factor_key: "1234567890",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
      {
        status: 200,
      }
    );
  }),

  http.post(buildMockApiUrl("/auth/admin/two-factor"), () => {
    if (Math.random() < 0.5) {
      return HttpResponse.json(
        {
          status: 400,
          message: "二次验证失败",
        },
        {
          status: 400,
        }
      );
    }

    return HttpResponse.json(
      {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
      {
        status: 200,
      }
    );
  }),

  http.get(buildMockApiUrl("/user/info"), () => {
    return HttpResponse.json(
      {
        name: "Ross",
        nickname: "Ross",
        provider: "admin",
        avatar: "https://wximg.chuanbaoguancha.cn/FiTobW1ALPNQB8NfnK_bGCx-onth",
        created_at: "2024-02-19 10:55:05",
      },
      {
        status: 200,
      }
    );
  }),
];

export default users;
