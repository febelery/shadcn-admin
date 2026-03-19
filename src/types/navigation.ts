import { type LinkProps } from '@tanstack/react-router'

/**
 * 导航项可以是链接或可折叠菜单
 */
export type NavItem = {
  title: string
  url?: LinkProps['to'] | (string & {})
  badge?: string
  icon?: string
  permission?: string
  items?: NavItem[]
}

/**
 * 导航组包含多个导航项
 */
export type NavGroup = {
  title: string
  items: NavItem[]
}

/**
 * 完整的菜单数据结构
 */
export type MenuData = {
  navGroups: NavGroup[]
}
