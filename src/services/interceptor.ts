import axios from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'

export interface ErrorResponse<T = unknown> {
  status: number
  message: string
  code: number
  data?: T
}

if (import.meta.env.VITE_API_BASE_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL
}

axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      config.headers.set('Content-Type', 'application/json')
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

axios.interceptors.response.use(
  (response: AxiosResponse): any => {
    // 适配mock返回的内容
    const { data } = response
    if (data?.status > 299 || data?.code > 299) {
      return Promise.reject(data)
    }

    return data
  },
  (error) => {
    if ([401].includes(error?.response?.status)) {
      // 使用 authStore 的 reset 方法清除所有认证信息
      useAuthStore.getState().reset()
      // 获取当前页面路径
      const redirect = encodeURIComponent(location.pathname + location.search)
      // 跳转到登录页面，并携带 redirect 参数
      window.location.href = `/login?redirect=${redirect}`
      return Promise.reject(
        new Error(error.response?.data?.message || '未授权，请重新登录')
      )
    }

    return Promise.reject(error)
  }
)
