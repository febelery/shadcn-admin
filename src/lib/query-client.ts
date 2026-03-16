import { AxiosError } from 'axios'
import {
  keepPreviousData,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { ROUTES } from '@/constants'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'

// 用于存储路由实例的引用
let routerInstance: any = null

/**
 * 设置路由实例引用
 */
export const setRouterInstance = (router: any) => {
  routerInstance = router
}

/**
 * 查询重试逻辑
 */
const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (import.meta.env.DEV) {
    console.log({ failureCount, error })
    return failureCount < 1
  }

  if (failureCount > 3) return false

  if (error instanceof AxiosError) {
    const status = error.response?.status
    return ![401, 403].includes(status ?? 0)
  }

  return true
}

/**
 * 处理查询错误
 */
const handleQueryError = (error: unknown) => {
  if (!(error instanceof AxiosError) || !routerInstance) return

  const status = error.response?.status

  switch (status) {
    case 401:
      toast.error('会话已过期！')
      useAuthStore.getState().auth.reset()
      routerInstance.navigate({
        to: ROUTES.SIGN_IN,
        search: { redirect: routerInstance.history.location.href },
      })
      break

    case 403:
      routerInstance.navigate({ to: ROUTES.FORBIDDEN })
      break

    case 500:
      toast.error('服务器内部错误！')
      routerInstance.navigate({ to: ROUTES.SERVER_ERROR })
      break
  }
}

/**
 * 处理变更操作错误
 */
const handleMutationError = (error: unknown) => {
  handleServerError(error)

  if (error instanceof AxiosError && error.response?.status === 304) {
    toast.error('内容未修改！')
  }
}

/**
 * 创建 QueryClient 实例
 */
export const createAppQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        refetchOnWindowFocus: import.meta.env.PROD,
        staleTime: 10_000,
        placeholderData: keepPreviousData, // 全局默认保留旧数据，避免闪烁
      },
      mutations: {
        onError: handleMutationError,
      },
    },
    queryCache: new QueryCache({
      onError: handleQueryError,
    }),
  })
}
