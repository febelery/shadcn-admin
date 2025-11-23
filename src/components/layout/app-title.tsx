import { Link } from '@tanstack/react-router'
import { appConfig } from '@/config/env'
import { cn } from '@/lib/utils'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { AppIcon } from '@/components/app-icon'

export function AppTitle() {
  const { setOpenMobile, state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size='lg'
            className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            asChild
          >
            <Link to='/' onClick={() => setOpenMobile(false)}>
              <AppIcon />
              {!isCollapsed && (
                <span className='truncate text-xl font-semibold'>
                  {appConfig.title}
                </span>
              )}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <SidebarTrigger
        className={cn(
          'transition-[width,height,padding] duration-200 ease-linear',
          isCollapsed && 'mt-4'
        )}
      />
    </>
  )
}
