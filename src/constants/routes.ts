/**
 * 路由常量
 */
export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  OTP: '/otp',
  DASHBOARD: '/dashboard',
  FORBIDDEN: '/forbidden',
  SERVER_ERROR: '/500',
  SETTINGS: '/settings',
  ACCOUNT: '/settings/account',
  NOTIFICATIONS: '/settings/notifications',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
