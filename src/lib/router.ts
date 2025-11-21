import { createRouter, createHashHistory } from '@tanstack/react-router'
import { appConfig } from '@/config/env'
import { routeTree } from '@/routeTree.gen'

/**
 * 创建路由实例
 */
export const createAppRouter = (queryClient: any) => {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    history: appConfig.useHashRouter ? createHashHistory() : undefined,
  })
}
