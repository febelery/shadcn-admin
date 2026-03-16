import axios from 'axios'
import { AUTH_COOKIE_KEY } from '@/constants'
import { create } from 'zustand'
import { getCookie, removeCookie, setCookie } from '@/lib/cookies'

export interface AuthUser {
  name: string
  email: string
  avatar: string
  role: string[]
}

interface AuthActions {
  user: AuthUser | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  reset: () => void
}

interface LoginCredentials {
  name: string
  password: string
}

interface AuthState {
  auth: AuthActions
}

function getToken(): string | undefined {
  return getCookie(AUTH_COOKIE_KEY) || undefined
}

function saveToken(token: string) {
  setCookie(AUTH_COOKIE_KEY, token)
}

function clearToken() {
  removeCookie(AUTH_COOKIE_KEY)
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  auth: {
    user: null,

    login: async (credentials) => {
      const { data } = await axios.post<{
        user: AuthUser
        accessToken: string
      }>('/api/login', credentials)
      saveToken(data.accessToken)
      set((state) => ({ auth: { ...state.auth, user: data.user } }))
    },

    logout: async () => {
      try {
        await axios.post('/api/logout')
      } finally {
        get().auth.reset()
      }
    },

    fetchUser: async () => {
      if (!getToken()) throw new Error('No access token')

      try {
        const { data } = await axios.get<AuthUser>('/api/me')
        set((state) => ({ auth: { ...state.auth, user: data } }))
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          get().auth.reset()
        }
        throw error
      }
    },

    reset: () => {
      clearToken()
      set((state) => ({ auth: { ...state.auth, user: null } }))
    },
  },
}))
