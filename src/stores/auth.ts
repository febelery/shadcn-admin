import { create } from 'zustand'

// 常量
const STORAGE_KEY = 'auth_token'
const USER_KEY = 'auth_user'
const DEFAULT_EXPIRY_SECONDS = 3600 // 1小时

interface StoredAuth {
  token: string
  expiresAt: number
}

interface AuthState {
  _user: object | null
  _token: string | null
  getUser: () => object | null
  getToken: () => string | null

  setUser: (user: object | null) => void
  setToken: (token: string) => void
  reset: () => void
  getRedirectAfterLogin: () => string
}

// 创建Zustand状态管理
export const useAuthStore = create<AuthState>((set) => {
  return {
    _user: null,
    _token: null,

    getUser: () => {
      const data = localStorage.getItem(USER_KEY)
      return data ? JSON.parse(data) : null
    },

    getToken: () => {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return null

      const auth = JSON.parse(data) as StoredAuth
      // 检查是否过期
      if (auth.expiresAt < Date.now()) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
      return auth.token
    },

    // 方法
    setUser: (user) => {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(USER_KEY)
      }
      set({ _user: user })
    },

    setToken: (token) => {
      const expiresAt = Date.now() + DEFAULT_EXPIRY_SECONDS * 1000
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, expiresAt }))
      set({ _token: token })
    },

    reset: () => {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(USER_KEY)
      set({ _user: null, _token: null })
    },

    getRedirectAfterLogin: () => {
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirect')
      return redirect ? decodeURIComponent(redirect) : '/tasks'
    },
  }
})
