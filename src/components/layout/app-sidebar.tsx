import React from 'react'
import { cn } from '@/lib/utils'
import { useLayout } from '@/context/layout-provider'
import { useMenuData } from '@/hooks/use-menu-data'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { AppTitle } from './app-title'
import { NavActions } from './nav-actions'
import { NavGroup } from './nav-group'
import { NavSearch } from './nav-search'
import { NavUser } from './nav-user'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { collapsible, variant } = useLayout()
  const { menuData } = useMenuData()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <Sidebar collapsible={collapsible} variant={variant} {...props}>
      <SidebarHeader
        className={cn(
          'flex',
          isCollapsed
            ? 'flex-col items-center justify-between gap-y-2'
            : 'flex-row items-center justify-between'
        )}
      >
        <AppTitle />
      </SidebarHeader>
      <NavSearch
        className={cn(
          'flex items-center justify-center p-2',
          isCollapsed && 'mb-4 p-0'
        )}
      />
      <SidebarContent>
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
  )
}
