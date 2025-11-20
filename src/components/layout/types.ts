import { type LinkProps } from '@tanstack/react-router'

type NavItem = {
  title: string
  url?: LinkProps['to'] | (string & {})
  badge?: string
  icon?: string
  items?: NavItem[]
}

type NavGroup = {
  title: string
  items: NavItem[]
}

type SidebarData = {
  navGroups: NavGroup[]
}

type NavCollapsible = NavItem
type NavLink = NavItem
export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink }
