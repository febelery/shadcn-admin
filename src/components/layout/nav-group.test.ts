import { describe, it, expect } from 'vitest'
import { checkIsActive, hasActiveChild } from './nav-group'
import { type NavItem } from '@/types/navigation'

describe('Navigation active matching', () => {
  const profileItem: NavItem = {
    title: 'Profile',
    url: '/setting/profile',
  }

  const appearanceItem: NavItem = {
    title: 'Appearance',
    url: '/setting/appearance',
  }

  const userItem: NavItem = {
    title: 'User',
    url: '/user',
  }

  const dashboardItem: NavItem = {
    title: 'Dashboard',
    url: '/',
  }

  const settingGroupItem: NavItem = {
    title: 'Setting',
    items: [profileItem, appearanceItem],
  }

  it('should activate appearance when on /setting/appearance', () => {
    expect(checkIsActive('/setting/appearance', appearanceItem)).toBe(true)
  })

  it('should NOT activate profile when on /setting/appearance', () => {
    expect(checkIsActive('/setting/appearance', profileItem)).toBe(false)
  })

  it('should activate profile when on /setting/profile', () => {
    expect(checkIsActive('/setting/profile', profileItem)).toBe(true)
  })

  it('should activate parent group when child is active', () => {
    expect(hasActiveChild('/setting/appearance', settingGroupItem)).toBe(true)
    expect(hasActiveChild('/setting/profile', settingGroupItem)).toBe(true)
    expect(hasActiveChild('/user', settingGroupItem)).toBe(false)
  })

  it('should activate module when on sub-route without own menu link', () => {
    expect(checkIsActive('/user/123', userItem)).toBe(true)
    expect(checkIsActive('/user/create', userItem)).toBe(true)
    expect(checkIsActive('/user-other', userItem)).toBe(false)
  })

  it('should only activate root on exact root path', () => {
    expect(checkIsActive('/', dashboardItem)).toBe(true)
    expect(checkIsActive('/setting', dashboardItem)).toBe(false)
    expect(checkIsActive('/user', dashboardItem)).toBe(false)
  })
})
