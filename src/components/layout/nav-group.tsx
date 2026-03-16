import { type ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { type NavItem, type NavGroup } from '@/types/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
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
        asChild
        isActive={checkIsActive(href, item)}
        tooltip={item.title}
      >
        <Link to={item.url} onClick={() => setOpenMobile(false)}>
          {item.icon && <DynamicIcon name={item.icon} />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </Link>
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
  const { setOpenMobile } = useSidebar()
  const hasActive = hasActiveChild(href, item)
  return (
    <Collapsible
      asChild
      defaultOpen={checkIsActive(href, item, true)}
      className='group/collapsible'
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            className={cn(hasActive && 'text-foreground font-semibold')}
          >
            {item.icon && <DynamicIcon name={item.icon} />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub className='mr-0 pr-0'>
            {item.items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                {subItem.items ? (
                  <Collapsible
                    asChild
                    defaultOpen={checkIsActive(href, subItem, true)}
                    className='group/collapsible'
                  >
                    <div>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuSubButton
                          className={cn(
                            'cursor-pointer',
                            hasActiveChild(href, subItem) &&
                              'text-foreground font-semibold'
                          )}
                        >
                          {subItem.icon && <DynamicIcon name={subItem.icon} />}
                          <span>{subItem.title}</span>
                          {subItem.badge && (
                            <NavBadge>{subItem.badge}</NavBadge>
                          )}
                          <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                        </SidebarMenuSubButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className='CollapsibleContent'>
                        <SidebarMenuSub className='mr-0 pr-0'>
                          {subItem.items.map((subSubItem) => (
                            <SidebarMenuSubItem key={subSubItem.title}>
                              {/* Recursively handle more levels if needed, but for now let's stick to the requested structure or make a truly recursive component */}
                              {/* To make it truly recursive, we should probably extract this into a component */}
                              <RecursiveSidebarMenuSubItem
                                item={subSubItem}
                                href={href}
                              />
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ) : (
                  <SidebarMenuSubButton
                    asChild
                    isActive={checkIsActive(href, subItem)}
                  >
                    <Link
                      to={subItem.url!}
                      onClick={() => setOpenMobile(false)}
                    >
                      {subItem.icon && <DynamicIcon name={subItem.icon} />}
                      <span>{subItem.title}</span>
                      {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                    </Link>
                  </SidebarMenuSubButton>
                )}
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
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
        asChild
        defaultOpen={checkIsActive(href, item, true)}
        className='group/collapsible'
      >
        <div>
          <CollapsibleTrigger asChild>
            <SidebarMenuSubButton
              className={cn(
                hasActiveChild(href, item) && 'text-foreground font-semibold'
              )}
            >
              {item.icon && <DynamicIcon name={item.icon} />}
              <span>{item.title}</span>
              {item.badge && <NavBadge>{item.badge}</NavBadge>}
              <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
            </SidebarMenuSubButton>
          </CollapsibleTrigger>
          <CollapsibleContent className='CollapsibleContent'>
            <SidebarMenuSub>
              {item.items.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <RecursiveSidebarMenuSubItem item={subItem} href={href} />
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </div>
      </Collapsible>
    )
  }

  return (
    <SidebarMenuSubButton asChild isActive={checkIsActive(href, item)}>
      <Link to={item.url!} onClick={() => setOpenMobile(false)}>
        {item.icon && <DynamicIcon name={item.icon} />}
        <span>{item.title}</span>
        {item.badge && <NavBadge>{item.badge}</NavBadge>}
      </Link>
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
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={checkIsActive(href, item)}
            className={cn(hasActive && 'text-foreground font-semibold')}
          >
            {item.icon && <DynamicIcon name={item.icon} />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuLabel>
            {item.title} {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items?.map((sub) => {
            const hasActive = hasActiveChild(href, sub)
            return (
              <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
                {sub.items ? (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger
                      className={cn(
                        hasActive && 'text-foreground font-semibold'
                      )}
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
                ) : (
                  <Link
                    to={sub.url!}
                    className={`${checkIsActive(href, sub) ? 'bg-secondary' : ''}`}
                  >
                    {sub.icon && <DynamicIcon name={sub.icon} />}
                    <span className='max-w-52 text-wrap'>{sub.title}</span>
                    {sub.badge && (
                      <span className='ms-auto text-xs'>{sub.badge}</span>
                    )}
                  </Link>
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
    <DropdownMenuItem asChild>
      <Link
        to={item.url!}
        className={`${checkIsActive(href, item) ? 'bg-secondary' : ''}`}
      >
        {item.icon && <DynamicIcon name={item.icon} />}
        <span className='max-w-52 text-wrap'>{item.title}</span>
        {item.badge && <span className='ms-auto text-xs'>{item.badge}</span>}
      </Link>
    </DropdownMenuItem>
  )
}

// 检查父级是否有激活的子项（排除自身）
export function hasActiveChild(href: string, item: NavItem): boolean {
  if (!item.items) return false
  // 检查是否有子项激活，但排除自身激活
  const isSelfActive = href === item.url || href.split('?')[0] === item.url
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
    href === item.url || // /endpint?search=param
    href.split('?')[0] === item.url || // endpoint
    !!item?.items?.filter((i) => checkIsActive(href, i)).length || // if child nav is active
    (mainNav &&
      href.split('/')[1] !== '' &&
      href.split('/')[1] === item?.url?.split('/')[1])
  )
}
