import React from 'react'
import { Outlet } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider, useLayout } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppTopbar } from '@/components/layout/app-topbar'
import { Header } from '@/components/layout/header'
import { Search } from '@/components/search'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { ConfigDrawer } from '@/components/config-drawer'
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
  const { navType } = useLayout()

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={navType === 'topbar' ? false : undefined}
      className={cn(navType === 'topbar' ? 'flex-col' : '')}
    >
      <SkipToMain />
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  )
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { navType } = useLayout()

  if (navType === 'topbar') {
    return (
      <>
        <AppSidebar className='md:hidden' />
        <AppTopbar />
        <main className='flex-1 bg-background'>{children ?? <Outlet />}</main>
      </>
    )
  }

  return (
    <>
      <AppSidebar />
      <SidebarInset
        className={cn(
          // Set content container, so we can use container queries
          '@container/content',

          // If layout is fixed, set the height
          // to 100svh to prevent overflow
          'has-data-[layout=fixed]:h-svh',

          // If layout is fixed and sidebar is inset,
          // set the height to 100svh - spacing (total margins) to prevent overflow
          'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
        )}
      >
        <Header>
          <Search />
          <div className='ms-auto flex items-center space-x-4'>
            <AnimatedThemeToggler />
            <ConfigDrawer />
          </div>
        </Header>
        {children ?? <Outlet />}
      </SidebarInset>
    </>
  )
}
