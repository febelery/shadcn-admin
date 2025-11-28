import React from 'react'
import { Link } from '@tanstack/react-router'
import { appConfig } from '@/config/env'
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

// 使用 mask-image 实现渐变遮罩的 SidebarContent 包装组件
function SidebarContentWithFade({
  children,
  className,
  ...props
}: React.ComponentProps<typeof SidebarContent>) {
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    const container = contentRef.current
    if (!container) return

    function updateScrollState() {
      if (!container) return

      const scrollTop = container.scrollTop
      const clientHeight = container.clientHeight
      const scrollHeight = container.scrollHeight
      const offset = 0

      const newHasTopScroll = scrollTop > offset
      const newHasBottomScroll =
        scrollTop + clientHeight + offset < scrollHeight
      const isScrollable = scrollHeight > clientHeight

      // 设置 data 属性用于 CSS 选择器
      if (newHasTopScroll && newHasBottomScroll && isScrollable) {
        container.setAttribute('data-top-bottom-scroll', 'true')
        container.removeAttribute('data-top-scroll')
        container.removeAttribute('data-bottom-scroll')
      } else {
        container.removeAttribute('data-top-bottom-scroll')
        if (newHasTopScroll && isScrollable) {
          container.setAttribute('data-top-scroll', 'true')
        } else {
          container.removeAttribute('data-top-scroll')
        }
        if (newHasBottomScroll && isScrollable) {
          container.setAttribute('data-bottom-scroll', 'true')
        } else {
          container.removeAttribute('data-bottom-scroll')
        }
      }
    }

    updateScrollState()
    container.addEventListener('scroll', updateScrollState)
    window.addEventListener('resize', updateScrollState)

    // 使用 ResizeObserver 监听内容变化
    const resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <SidebarContent
      ref={contentRef}
      className={cn(
        // 使用 mask-image 实现渐变遮罩，参考 scroller.tsx 的实现
        // 顶部渐变：当有顶部滚动时显示
        'data-[top-scroll=true]:mask-[linear-gradient(0deg,#000_calc(100%-var(--scroll-shadow-size)),transparent)]',
        // 底部渐变：当有底部滚动时显示
        'data-[bottom-scroll=true]:mask-[linear-gradient(180deg,#000_calc(100%-var(--scroll-shadow-size)),transparent)]',
        // 同时有顶部和底部滚动时
        'data-[top-bottom-scroll=true]:mask-[linear-gradient(#000,#000,transparent_0,#000_var(--scroll-shadow-size),#000_calc(100%-var(--scroll-shadow-size)),transparent)]',
        className
      )}
      style={
        {
          '--scroll-shadow-size': '24px',
          ...props.style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </SidebarContent>
  )
}

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
        <SidebarContentWithFade>
          {menuData.navGroups?.map((props) => (
            <NavGroup key={props.title} {...props} />
          ))}
        </SidebarContentWithFade>
        <SidebarFooter>
          <NavActions className='px-0' />
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  )
}
