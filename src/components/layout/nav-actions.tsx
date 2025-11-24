import * as React from 'react'
import { cn } from '@/lib/utils'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { ConfigDrawer } from '@/components/config-drawer'

export function NavActions({
  ...props
}: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <div
              className={cn(
                'peer/menu-button ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-start text-sm outline-hidden transition-[width,height,padding] focus-visible:ring-2',
                'group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2',
                '[&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
                '[&>button]:flex [&>button]:h-auto [&>button]:min-w-0 [&>button]:items-center [&>button]:gap-2 [&>button]:p-0 [&>button]:hover:bg-transparent',
                'group-data-[collapsible=icon]:[&>button]:size-4!',
                'h-7 text-xs'
              )}
            >
              <ConfigDrawer showLabel={!isCollapsed} />
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div
              className={cn(
                'peer/menu-button ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-start text-sm outline-hidden transition-[width,height,padding] focus-visible:ring-2',
                'group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2',
                '[&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
                '[&>button]:flex [&>button]:h-auto [&>button]:min-w-0 [&>button]:items-center [&>button]:gap-2 [&>button]:p-0 [&>button]:hover:bg-transparent',
                'group-data-[collapsible=icon]:[&>button]:size-4!',
                'h-7 text-xs'
              )}
            >
              <AnimatedThemeToggler showLabel={!isCollapsed} />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
