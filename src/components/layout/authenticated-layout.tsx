import React from 'react'
import { Outlet } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider, useLayout } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppTopbar } from '@/components/layout/app-topbar'
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
  const { isTopbarLayout } = useLayout()

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={isTopbarLayout ? false : undefined}
      className={cn(isTopbarLayout ? 'h-svh flex-col' : '')}
    >
      <SkipToMain />
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  )
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isTopbarLayout } = useLayout()

  if (isTopbarLayout) {
    return (
      <>
        <AppSidebar className='md:hidden' />
        <AppTopbar />
        <div
          className={cn(
            'bg-background flex-1',

            // 如果布局是固定的，确保这个容器不会溢出
            'has-data-[layout=fixed]:flex has-data-[layout=fixed]:flex-col has-data-[layout=fixed]:overflow-hidden'
          )}
        >
          {children ?? <Outlet />}
        </div>
      </>
    )
  }

  return (
    <>
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
    </>
  )
}
