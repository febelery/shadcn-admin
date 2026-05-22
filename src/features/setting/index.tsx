import { Outlet } from '@tanstack/react-router'
import { Monitor, Bell, Palette, Wrench, UserCog } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { PageLayout } from '@/components/layout/page-layout'
import { SidebarNav } from './components/sidebar-nav'

const sidebarNavItems = [
  {
    title: 'Profile',
    href: '/setting',
    icon: <UserCog size={18} />,
  },
  {
    title: 'Account',
    href: '/setting/account',
    icon: <Wrench size={18} />,
  },
  {
    title: 'Appearance',
    href: '/setting/appearance',
    icon: <Palette size={18} />,
  },
  {
    title: 'Notification',
    href: '/setting/notification',
    icon: <Bell size={18} />,
  },
  {
    title: 'Display',
    href: '/setting/display',
    icon: <Monitor size={18} />,
  },
]

export function SettingPage() {
  return (
    <PageLayout
      variant='fixed'
      title='Setting'
      description='Manage your account settings and set e-mail preferences.'
    >
      <Separator className='my-4 lg:my-6' />
      <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <aside className='top-0 lg:sticky lg:w-1/5'>
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className='flex w-full overflow-y-hidden p-1'>
          <Outlet />
        </div>
      </div>
    </PageLayout>
  )
}
