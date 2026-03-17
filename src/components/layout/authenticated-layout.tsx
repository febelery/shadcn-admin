import { useState, Suspense } from 'react'
import { Outlet } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider, useLayout } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/error-boundary'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'

/**
 * 应用主布局。
 *
 * 职责：
 * - 挂载全局 context（搜索、布局、侧边栏）
 * - 侧边栏开合状态持久化（读取 cookie，仅挂载时读一次）
 * - ErrorBoundary + Suspense 双层防线
 *
 * 仅作为路由布局使用，由 TanStack Router 自动渲染子路由。
 */
export function AuthenticatedLayout() {
  // 惰性初始化：只在挂载时读一次 cookie，不随父级重渲染重复执行
  const [defaultOpen] = useState(() => getCookie('sidebar_state') !== 'false')

  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <ErrorBoundary>
            <Suspense fallback={<LayoutSkeleton />}>
              <AppSidebar />
              <SidebarInset
                className={cn(
                  '@container/content',
                  'has-data-[layout=fixed]:h-svh',
                  'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
                )}
              >
                <Outlet />
              </SidebarInset>
            </Suspense>
          </ErrorBoundary>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}

/**
 * 布局级骨架屏
 */
function LayoutSkeleton() {
  const { variant } = useLayout()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <div className='bg-background flex h-svh w-full overflow-hidden'>
      {/* 侧边栏占位 */}
      <div
        className={cn(
          'bg-sidebar hidden shrink-0 flex-col py-6 transition-[width] duration-200 ease-linear md:flex',
          isCollapsed ? 'w-12 items-center' : 'w-64 px-4'
        )}
      >
        <Skeleton shimmer className='mb-10 size-8 shrink-0 rounded-md' />

        <div className='flex w-full flex-1 flex-col gap-6'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3',
                isCollapsed && 'justify-center'
              )}
            >
              <Skeleton
                shimmer
                className='size-5 shrink-0 rounded-sm opacity-60'
              />
              {!isCollapsed && (
                <Skeleton shimmer className='h-3 w-full opacity-30' />
              )}
            </div>
          ))}
        </div>

        <Skeleton
          shimmer
          className={cn(
            'size-8 shrink-0 rounded-full',
            !isCollapsed && 'w-full'
          )}
        />
      </div>

      {/* 主内容区占位 */}
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden',
          variant === 'inset' &&
            'bg-background md:m-2 md:ms-0 md:rounded-xl md:shadow-sm'
        )}
      >
        <div className='flex h-16 shrink-0 items-center justify-between px-6'>
          <Skeleton shimmer className='h-4 w-32 opacity-40' />
          <Skeleton shimmer className='size-8 rounded-full opacity-40' />
        </div>

        <div className='flex-1 space-y-6 p-8'>
          <Skeleton shimmer className='h-8 w-1/4 opacity-40' />
          <Skeleton shimmer className='h-full w-full opacity-10' />
        </div>
      </div>
    </div>
  )
}
