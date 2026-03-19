import axios from 'axios'
import { create } from 'zustand'

const AUTH_STORAGE_KEY = 'auth_token'

export interface AuthUser {
  name: string
  email: string
  avatar: string
  role: string[]
  permissions: string[]
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

export function getToken(): string | undefined {
  return localStorage.getItem(AUTH_STORAGE_KEY) || undefined
}

function saveToken(token: string) {
  localStorage.setItem(AUTH_STORAGE_KEY, token)
}

function clearToken() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

// Set up global axios interceptor for auth token
axios.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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
