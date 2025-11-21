/**
 * 环境变量配置
 *
 * 统一管理项目中的环境变量，提供类型安全和默认值
 * 所有环境变量都应该通过此文件访问，而不是直接使用 import.meta.env
 */

/**
 * 获取环境变量值，如果不存在则返回默认值
 */
function getEnv(key: string, defaultValue: string): string {
  return import.meta.env[key] || defaultValue
}

/**
 * 获取布尔类型环境变量值
 */
function getBoolEnv(key: string, defaultValue: boolean): boolean {
  const value = import.meta.env[key]
  if (value === undefined) return defaultValue
  return value === 'true' || value === '1'
}

/**
 * 获取可选的环境变量值
 */
function getOptionalEnv(key: string): string | undefined {
  const value = import.meta.env[key]
  return value || undefined
}

/**
 * 应用配置
 */
export const appConfig = {
  /**
   * 应用标题
   * 默认值: 'Shadcn Admin'
   */
  title: getEnv('VITE_APP_TITLE', 'Shadcn Admin'),

  /**
   * 应用副标题
   * 默认值: 'Vite + ShadcnUI'
   */
  subtitle: getEnv('VITE_APP_SUBTITLE', 'Vite + ShadcnUI'),

  /**
   * 应用图标 URL
   * 如果设置了此值，将显示图片；否则显示默认的 Command 图标
   * 默认值: undefined
   */
  icon: getOptionalEnv('VITE_APP_ICON'),

  /**
   * API 基础 URL
   * 默认值: ''
   */
  apiUrl: getEnv('VITE_API_URL', ''),

  /**
   * 路由模式
   * true: 使用 hash 路由模式 (createHashHistory)
   * false: 使用 history 路由模式 (默认)
   * 默认值: false
   */
  useHashRouter: getBoolEnv('VITE_HASH_ROUTER', false),
} as const
