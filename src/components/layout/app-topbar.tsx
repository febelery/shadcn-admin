import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { type NavItem } from '@/types/navigation'
import { ChevronDown } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useMenuData } from '@/hooks/use-menu-data'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ConfigDrawer } from '@/components/config-drawer'
import { AppTitle } from '@/components/layout/app-title'
import { hasActiveChild, checkIsActive } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'

export function AppTopbar() {
  const { menuData } = useMenuData()
  const href = useLocation({ select: (location) => location.href })

  const [hoveredPath, setHoveredPath] = useState<string | null>(null)

  return (
    <header
      className={cn(
        'bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur',
        'flex h-14 items-center px-2'
      )}
    >
      <div className='mr-4 hidden md:flex'>
        <AppTitle />
      </div>

      <div className='flex flex-1 items-center md:hidden'>
        <SidebarTrigger className='mr-2' />
      </div>

      <div className='hidden flex-1 items-center gap-2 md:flex'>
        <nav className='flex items-center gap-1'>
          {menuData.navGroups.map((group) => {
            const isHovered = hoveredPath === group.title

            // If group has only 1 item and it's a leaf node, render as a simple link
            if (group.items.length === 1 && !group.items[0].items) {
              return (
                <Link
                  key={group.title}
                  to={group.items[0].url!}
                  className={cn(
                    'relative inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                    'text-muted-foreground hover:text-foreground'
                  )}
                  activeProps={{
                    className: 'text-foreground font-semibold',
                  }}
                  onMouseEnter={() => setHoveredPath(group.title)}
                  onMouseLeave={() => setHoveredPath(null)}
                >
                  {({ isActive }: { isActive: boolean }) => (
                    <>
                      {(isHovered || isActive) && (
                        <motion.div
                          className='bg-accent absolute inset-0 rounded-md'
                          layoutId='navbar-indicator'
                          transition={{
                            type: 'spring',
                            bounce: 0.2,
                            duration: 0.6,
                          }}
                        />
                      )}
                      <span className='relative z-10'>
                        {group.items[0].title}
                      </span>
                    </>
                  )}
                </Link>
              )
            }

            // Otherwise render as a dropdown
            const hasActive = group.items.some((item) => {
              // 如果 item 本身激活
              if (checkIsActive(href, item)) return true
              // 如果 item 有激活的子项
              if (hasActiveChild(href, item)) return true
              return false
            })
            return (
              <DropdownMenu key={group.title}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className={cn(
                      'text-muted-foreground hover:text-foreground relative h-9 px-4 py-2 hover:bg-transparent data-[state=open]:bg-transparent',
                      'text-sm font-medium',
                      hasActive && 'text-foreground font-semibold'
                    )}
                    onMouseEnter={() => setHoveredPath(group.title)}
                    onMouseLeave={() => setHoveredPath(null)}
                  >
                    {isHovered && (
                      <motion.div
                        className='bg-accent absolute inset-0 rounded-md'
                        layoutId='navbar-indicator'
                        transition={{
                          type: 'spring',
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                    <span className='relative z-10 flex items-center'>
                      {group.title}
                      <ChevronDown className='ml-1 size-3' />
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start' className='w-48'>
                  {group.items.map((item) => (
                    <TopNavItem key={item.title} item={item} href={href} />
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          })}
        </nav>
      </div>

      <div className='flex items-center gap-2'>
        <AnimatedThemeToggler />
        <ConfigDrawer />
        <NavUser isTopbar />
      </div>
    </header>
  )
}

function TopNavItem({ item, href }: { item: NavItem; href: string }) {
  if (item.items) {
    const hasActive = hasActiveChild(href, item)
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          className={cn(hasActive && 'text-foreground font-semibold')}
        >
          {item.icon && (
            <DynamicIcon name={item.icon} className='mr-2 size-4' />
          )}
          {item.title}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {item.items.map((sub) => (
            <TopNavItem key={sub.title} item={sub} href={href} />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    )
  }

  return (
    <DropdownMenuItem asChild>
      <Link
        to={item.url!}
        className='cursor-pointer'
        activeProps={{
          className: 'bg-accent text-accent-foreground font-semibold',
        }}
      >
        {item.icon && <DynamicIcon name={item.icon} className='mr-2 size-4' />}
        {item.title}
      </Link>
    </DropdownMenuItem>
  )
}
