/**
 * 路由常量
 */
export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  OTP: '/otp',
  DASHBOARD: '/dashboard',
  FORBIDDEN: '/403',
  SERVER_ERROR: '/500',
  SETTING: '/setting',
  ACCOUNT: '/setting/account',
  NOTIFICATION: '/setting/notification',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
