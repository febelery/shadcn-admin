import { type ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { type NavItem, type NavGroup } from '@/types/navigation'
import { cn } from 'cn'
import { ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

export function NavGroup({ title, items }: NavGroup) {
  const { state, isMobile } = useSidebar()
  const href = useLocation({ select: (location) => location.href })
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const key = `${item.title}-${item.url}`

          if (!item.items)
            return <SidebarMenuLink key={key} item={item} href={href} />

          if (state === 'collapsed' && !isMobile)
            return (
              <SidebarMenuCollapsedDropdown key={key} item={item} href={href} />
            )

          return <SidebarMenuCollapsible key={key} item={item} href={href} />
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavBadge({ children }: { children: ReactNode }) {
  return <Badge className='rounded-full px-1 py-0 text-xs'>{children}</Badge>
}

function SidebarMenuLink({ item, href }: { item: NavItem; href: string }) {
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link to={item.url} onClick={() => setOpenMobile(false)} />}
        isActive={checkIsActive(href, item)}
        tooltip={item.title}
      >
        {item.icon && <DynamicIcon name={item.icon} />}
        <span>{item.title}</span>
        {item.badge && <NavBadge>{item.badge}</NavBadge>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarMenuCollapsible({
  item,
  href,
}: {
  item: NavItem
  href: string
}) {
  const hasActive = hasActiveChild(href, item)
  return (
    <Collapsible
      render={<SidebarMenuItem className='group/collapsible' />}
      defaultOpen={checkIsActive(href, item, true)}
    >
      <CollapsibleTrigger
        render={
          <SidebarMenuButton
            tooltip={item.title}
            className={cn(hasActive && 'text-foreground font-semibold')}
          />
        }
      >
        {item.icon && <DynamicIcon name={item.icon} />}
        <span>{item.title}</span>
        {item.badge && <NavBadge>{item.badge}</NavBadge>}
        <ChevronRight className='ms-auto transition-transform duration-200 group-aria-expanded/collapsible-trigger:rotate-90 group-data-panel-open/collapsible-trigger:rotate-90 [[data-panel-open]>&]:rotate-90' />
      </CollapsibleTrigger>
      <CollapsibleContent className='CollapsibleContent'>
        <SidebarMenuSub className='mr-0 pr-0'>
          {item.items?.map((subItem) => (
            <SidebarMenuSubItem key={subItem.title}>
              <RecursiveSidebarMenuSubItem item={subItem} href={href} />
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}

function RecursiveSidebarMenuSubItem({
  item,
  href,
}: {
  item: NavItem
  href: string
}) {
  const { setOpenMobile } = useSidebar()
  if (item.items) {
    return (
      <Collapsible
        defaultOpen={checkIsActive(href, item, true)}
        className='group/collapsible w-full'
      >
        <CollapsibleTrigger
          render={
            <SidebarMenuSubButton
              render={<button type='button' />}
              className={cn(
                'cursor-pointer',
                hasActiveChild(href, item) && 'text-foreground font-semibold'
              )}
            />
          }
        >
          {item.icon && <DynamicIcon name={item.icon} />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
          <ChevronRight className='ms-auto transition-transform duration-200 group-aria-expanded/collapsible-trigger:rotate-90 group-data-panel-open/collapsible-trigger:rotate-90 [[data-panel-open]>&]:rotate-90' />
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub className='mr-0 pr-0'>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <RecursiveSidebarMenuSubItem item={subItem} href={href} />
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <SidebarMenuSubButton
      render={<Link to={item.url!} onClick={() => setOpenMobile(false)} />}
      isActive={checkIsActive(href, item)}
    >
      {item.icon && <DynamicIcon name={item.icon} />}
      <span>{item.title}</span>
      {item.badge && <NavBadge>{item.badge}</NavBadge>}
    </SidebarMenuSubButton>
  )
}

function SidebarMenuCollapsedDropdown({
  item,
  href,
}: {
  item: NavItem
  href: string
}) {
  const hasActive = hasActiveChild(href, item)
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              tooltip={item.title}
              isActive={checkIsActive(href, item)}
              className={cn(hasActive && 'text-foreground font-semibold')}
            />
          }
        >
          {item.icon && <DynamicIcon name={item.icon} />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
          <ChevronRight className='ms-auto transition-transform duration-200 [[data-popup-open]>&]:rotate-90' />
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              {item.title} {item.badge ? `(${item.badge})` : ''}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {item.items?.map((sub) => {
            const hasActive = hasActiveChild(href, sub)
            if (sub.items) {
              return (
                <DropdownMenuSub key={`${sub.title}-${sub.url}`}>
                  <DropdownMenuSubTrigger
                    className={cn(hasActive && 'text-foreground font-semibold')}
                  >
                    {sub.icon && <DynamicIcon name={sub.icon} />}
                    <span>{sub.title}</span>
                    {sub.badge && <NavBadge>{sub.badge}</NavBadge>}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {sub.items.map((subSub) => (
                      <RecursiveDropdownMenuItem
                        key={`${subSub.title}-${subSub.url}`}
                        item={subSub}
                        href={href}
                      />
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )
            }
            return (
              <DropdownMenuItem
                key={`${sub.title}-${sub.url}`}
                render={
                  <Link
                    to={sub.url!}
                    className={`${checkIsActive(href, sub) ? 'bg-secondary' : ''}`}
                  />
                }
              >
                {sub.icon && <DynamicIcon name={sub.icon} />}
                <span className='max-w-52 text-wrap'>{sub.title}</span>
                {sub.badge && (
                  <span className='ms-auto text-xs'>{sub.badge}</span>
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function RecursiveDropdownMenuItem({
  item,
  href,
}: {
  item: NavItem
  href: string
}) {
  if (item.items) {
    const hasActive = hasActiveChild(href, item)
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          className={cn(hasActive && 'text-foreground font-semibold')}
        >
          {item.icon && <DynamicIcon name={item.icon} />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {item.items.map((sub) => (
            <RecursiveDropdownMenuItem
              key={`${sub.title}-${sub.url}`}
              item={sub}
              href={href}
            />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    )
  }

  return (
    <DropdownMenuItem
      render={
        <Link
          to={item.url!}
          className={`${checkIsActive(href, item) ? 'bg-secondary' : ''}`}
        />
      }
    >
      {item.icon && <DynamicIcon name={item.icon} />}
      <span className='max-w-52 text-wrap'>{item.title}</span>
      {item.badge && <span className='ms-auto text-xs'>{item.badge}</span>}
    </DropdownMenuItem>
  )
}

// 检查父级是否有激活的子项（排除自身）
export function hasActiveChild(href: string, item: NavItem): boolean {
  if (!item.items) return false
  // 检查是否有子项激活，但排除自身激活
  const isSelfActive = isActiveUrlMatch(href, item.url, item.exact)
  if (isSelfActive) return false
  // 检查子项是否有激活的
  return item.items.some((child) => checkIsActive(href, child))
}

// 导出 checkIsActive 供其他组件使用
export function checkIsActive(
  href: string,
  item: NavItem,
  mainNav = false
): boolean {
  return (
    isActiveUrlMatch(href, item.url, item.exact) ||
    !!item?.items?.filter((i) => checkIsActive(href, i)).length || // if child nav is active
    (mainNav &&
      getPathname(href).split('/')[1] !== '' &&
      getPathname(href).split('/')[1] === getPathname(item?.url).split('/')[1])
  )
}

function isActiveUrlMatch(
  href: string,
  itemUrl?: string,
  exact?: boolean
): boolean {
  if (!itemUrl) return false

  const currentPath = getPathname(href)
  const itemPath = getPathname(itemUrl)
  const activePath = getActiveBasePath(itemPath)

  // 根路径或指定 exact 只进行精确匹配
  if (exact || activePath === '/') {
    return currentPath === activePath
  }

  return currentPath === activePath || currentPath.startsWith(`${activePath}/`)
}

function getPathname(url?: string): string {
  if (!url) return ''
  const pathname = url.split(/[?#]/)[0] || '/'
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
}

function getActiveBasePath(pathname: string): string {
  if (pathname.endsWith('/list')) {
    const parentPath = pathname.slice(0, -'/list'.length)
    return parentPath || '/'
  }

  return pathname
}
