import Cookies from 'js-cookie'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'
import { SearchProvider } from '@/context/search-context'
import { useIsMobile } from '@/hooks/use-mobile'
import { SidebarProvider } from '@/components/ui/sidebar'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
  beforeLoad: async () => {
    if (!useAuthStore.getState().getToken()) {
      useAuthStore.getState().reset()
      throw redirect({
        to: '/login',
        replace: true,
      })
    }
  },
})

function RouteComponent() {
  const defaultOpen = Cookies.get('sidebar:state') !== 'false'
  const isMobile = useIsMobile()

  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        {isMobile && (
          <SidebarTrigger className='bg-background/95 supports-backdrop-filter:bg-background/60 fixed top-4 left-4 z-50 rounded-lg p-2 shadow-md backdrop-blur-sm' />
        )}
        <AppSidebar />
        <div
          id='content'
          className={cn(
            'ml-auto w-full max-w-full',
            'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
            'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
            'transition-[width] duration-200 ease-linear',
            'flex h-svh flex-col',
            'group-data-[scroll-locked=1]/body:h-full',
            'has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh'
          )}
        >
          <Outlet />
        </div>
      </SidebarProvider>
    </SearchProvider>
  )
}
