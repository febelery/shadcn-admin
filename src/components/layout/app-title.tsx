import { Link } from '@tanstack/react-router'
import { appConfig } from '@/config/env'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { AppIcon } from '@/components/app-icon'

export function AppTitle() {
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
          asChild
        >
          <Link to='/' onClick={() => setOpenMobile(false)}>
            <AppIcon />
            <div className='grid flex-1 text-start text-sm leading-tight'>
              <span className='truncate font-semibold'>{appConfig.title}</span>
              <span className='truncate text-xs'>{appConfig.subtitle}</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
