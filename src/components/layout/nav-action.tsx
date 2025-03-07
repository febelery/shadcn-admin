import { IconMoon, IconSun } from '@tabler/icons-react'
import { PanelLeft } from 'lucide-react'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useSidebar } from '@/components/ui/sidebar'
import { useTheme } from '@/components/theme-provider'

export function NavAction({
  ...props
}: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { toggleSidebar } = useSidebar()
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem key='主题'>
            <SidebarMenuButton size='sm' onClick={toggleTheme}>
              <IconSun className='size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
              <IconMoon className='absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
              <span>{theme == 'dark' ? '深色' : '浅色'}主题</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem key='侧边栏'>
            <SidebarMenuButton size='sm' onClick={toggleSidebar}>
              <PanelLeft />
              <span>收起菜单</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
