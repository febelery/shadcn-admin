import { create } from 'zustand'
import axios from 'axios'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'access_token'

interface AuthUser {
  name: string
  email: string
  avatar: string
  role: string[]
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
    login: (data: { name: string; password: string }) => Promise<void>
    logout: () => Promise<void>
  }
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const cookieState = getCookie(ACCESS_TOKEN)
  const initToken = cookieState ? cookieState : ''
  return {
    auth: {
      user: null,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          setCookie(ACCESS_TOKEN, accessToken)
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return {
            ...state,
            auth: { ...state.auth, user: null, accessToken: '' },
          }
        }),
      login: async (data) => {
        try {
          const response = await axios.post('/api/login', data)
          const { user, accessToken } = response.data
          set((state) => {
            setCookie(ACCESS_TOKEN, accessToken)
            return {
              ...state,
              auth: { ...state.auth, user, accessToken },
            }
          })
        } catch (error) {
          if (axios.isAxiosError(error) && error.response) {
             throw error.response.data
          }
          throw error
        }
      },
      logout: async () => {
        await axios.post('/api/logout')
        get().auth.reset()
      },
    },
  }
})
