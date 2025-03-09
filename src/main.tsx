import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import '@/services/interceptor'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'
import { handleServerError } from '@/utils/handle-server-error'
import { ThemeProvider } from './components/theme-provider'
import './index.css'
import { setupGlobalZodMessages } from './lib/zod-messages'
// Generated Routes
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient({
  // 全局缓存失效
  mutationCache: new MutationCache({
    onSuccess: () => {
      queryClient.invalidateQueries()
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // eslint-disable-next-line no-console
        if (import.meta.env.DEV) console.log({ failureCount, error })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000,
    },
    mutations: {
      onError: (error) => {
        handleServerError(error)
        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast.error('内容未修改')
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          toast.error('登陆信息已过期')
          useAuthStore.getState().reset()
          const redirect = `${router.history.location.href}`
          router.navigate({ to: '/login', search: { redirect } })
        }
        if (error.response?.status === 500) {
          toast.error('服务器错误')
          router.navigate({ to: '/500' })
        }
        if (error.response?.status === 403) {
          router.navigate({
            to: '/403',
            replace: true,
          })
        }
      }
    },
  }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const enableMocking = async () => {
  if (
    import.meta.env.MODE !== 'development' ||
    import.meta.env.VITE_MOCK !== 'true'
  ) {
    return
  }

  const { worker } = await import('./mocks/browser')
  return worker.start({
    onUnhandledRequest: 'bypass',
  })
}

// 设置全局 Zod 错误消息
setupGlobalZodMessages()

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)

  enableMocking().then(() => {
    root.render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme='light' storageKey='theme'>
            <RouterProvider router={router} />
          </ThemeProvider>
        </QueryClientProvider>
      </StrictMode>
    )
  })
}
