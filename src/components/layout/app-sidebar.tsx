import React from 'react'
import { Link } from '@tanstack/react-router'
import { appConfig } from '@/config/env'
import { ROUTES } from '@/constants'
import { cn } from '@/lib/utils'
import { useLayout } from '@/context/layout-provider'
import { useMenuData } from '@/hooks/use-menu-data'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
  SidebarFloatingTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppIcon } from '@/components/app-icon'
import { NavActions } from './nav-actions'
import { NavGroup } from './nav-group'
import { NavSearch } from './nav-search'
import { NavUser } from './nav-user'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { collapsible, variant } = useLayout()
  const { menuData } = useMenuData()
  const { state, setOpenMobile } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const isMobile = useIsMobile()

  return (
    <>
      {isMobile && <SidebarFloatingTrigger />}

      <Sidebar collapsible={collapsible} variant={variant} {...props}>
        <SidebarHeader
          className={cn(
            'flex',
            isCollapsed
              ? 'flex-col items-start justify-between gap-y-2'
              : 'flex-row items-center justify-between'
          )}
        >
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                asChild
              >
                <Link to={ROUTES.HOME} onClick={() => setOpenMobile(false)}>
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
              isCollapsed && 'mt-4 self-start'
            )}
          />
        </SidebarHeader>
        <NavSearch
          className={cn(
            'flex items-center justify-center p-2',
            isCollapsed && 'mb-4 self-start'
          )}
        />
        <SidebarContent withFade>
          {menuData.navGroups?.map((props) => (
            <NavGroup key={props.title} {...props} />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <NavActions className='px-0' />
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  )
}
