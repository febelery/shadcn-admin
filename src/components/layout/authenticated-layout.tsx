import React, { Suspense } from 'react'
import { Outlet } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/error-boundary'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <SearchProvider>
      <LayoutProvider>
        <LayoutWrapper>{children}</LayoutWrapper>
      </LayoutProvider>
    </SearchProvider>
  )
}

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <SkipToMain />
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  )
}

function LayoutSkeleton() {
  return (
    <div className='bg-background flex h-svh w-full overflow-hidden'>
      {/* 侧边栏 */}
      <div className='bg-sidebar hidden w-[--sidebar-width] shrink-0 flex-col gap-4 border-r p-4 md:flex'>
        {/* Logo 区域 */}
        <div className='flex items-center gap-3 px-2 py-1'>
          <Skeleton className='size-8 rounded-md' />
          <Skeleton className='h-4 w-24' />
        </div>

        <div className='flex flex-1 flex-col gap-6'>
          {/* 导航分组，随机宽度模拟真实菜单 */}
          {[4, 3, 5].map((count, groupIndex) => (
            <div key={groupIndex} className='flex flex-col gap-1'>
              <Skeleton className='mb-2 h-3 w-16 opacity-50' />
              {Array.from({ length: count }).map((_, i) => (
                <div
                  key={i}
                  className='flex items-center gap-3 rounded-md px-2 py-1.5'
                >
                  <Skeleton className='size-4 shrink-0 rounded-sm' />
                  <Skeleton
                    className='h-4'
                    style={{ width: `${[60, 75, 85, 50, 70][i % 5]}%` }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* 底部用户区域 */}
        <div className='flex items-center gap-3 border-t pt-4'>
          <Skeleton className='size-8 rounded-full' />
          <div className='flex flex-1 flex-col gap-1.5'>
            <Skeleton className='h-3.5 w-24' />
            <Skeleton className='h-3 w-32 opacity-60' />
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        {/* Header */}
        <div className='flex h-14 shrink-0 items-center gap-3 border-b px-4'>
          <Skeleton className='size-7 rounded-md md:hidden' />
          <Skeleton className='h-4 w-32' />
          <div className='ml-auto flex items-center gap-2'>
            <Skeleton className='size-8 rounded-full' />
            <Skeleton className='size-8 rounded-full' />
          </div>
        </div>

        {/* 内容 */}
        <div className='flex-1 space-y-6 overflow-auto p-6'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1.5'>
              <Skeleton className='h-6 w-36' />
              <Skeleton className='h-4 w-56 opacity-60' />
            </div>
            <Skeleton className='h-9 w-24 rounded-md' />
          </div>

          {/* 工具栏 */}
          <div className='flex items-center gap-2'>
            <Skeleton className='h-9 w-64 rounded-md' />
            <Skeleton className='ml-auto h-9 w-20 rounded-md' />
            <Skeleton className='h-9 w-20 rounded-md' />
          </div>

          {/* 表格 */}
          <div className='rounded-md border'>
            <div className='border-b p-3'>
              <div className='flex gap-4'>
                {[2, 3, 2, 2, 1].map((w, i) => (
                  <Skeleton key={i} className='h-4' style={{ flex: w }} />
                ))}
              </div>
            </div>
            <div className='divide-y'>
              {Array.from({ length: 10 }).map((_, rowIndex) => (
                <div key={rowIndex} className='flex gap-4 p-3'>
                  {[2, 3, 2, 2, 1].map((w, colIndex) => (
                    <Skeleton
                      key={colIndex}
                      className='h-4'
                      style={{
                        flex: w,
                        opacity: 1 - rowIndex * 0.06,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LayoutSkeleton />}>
        <AppSidebar />
        <SidebarInset
          className={cn(
            // 设置内容容器，以便我们可以使用容器查询
            '@container/content',

            // 如果布局是固定的，设置高度为 100svh 以防止溢出
            'has-data-[layout=fixed]:h-svh',

            // 如果布局是固定的，并且侧边栏是内嵌的，设置高度为 100svh - 间距（总边距）以防止溢出
            'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
          )}
        >
          {children ?? <Outlet />}
        </SidebarInset>
      </Suspense>
    </ErrorBoundary>
  )
}
