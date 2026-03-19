import { useMemo, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
} from '@/lib/permissions'

/**
 * 获取当前用户的权限列表
 */
export function usePermissions(): string[] {
  const user = useAuthStore((s) => s.auth.user)
  return user?.permissions ?? []
}

/**
 * 检查当前用户是否具备某个权限
 *
 * @param required - 需要的权限字符串，如 "users:access"
 * @returns 是否具备该权限
 *
 * @example
 * ```tsx
 * const canAccessUsers = useCan('users:access')
 * ```
 */
export function useCan(required: string): boolean {
  const permissions = usePermissions()
  return useMemo(
    () => hasPermission(permissions, required),
    [permissions, required]
  )
}

/**
 * 返回一个权限检查函数，用于在回调中动态检查权限
 *
 * @example
 * ```tsx
 * const checkPermission = useCanCheck()
 * if (checkPermission('users:create')) { ... }
 * ```
 */
export function useCanCheck(): (required: string) => boolean {
  const permissions = usePermissions()
  return useCallback(
    (required: string) => hasPermission(permissions, required),
    [permissions]
  )
}

/**
 * 检查当前用户是否具备所有指定权限
 */
export function useCanAll(required: string[]): boolean {
  const permissions = usePermissions()
  return useMemo(
    () => hasAllPermissions(permissions, required),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permissions, ...required]
  )
}

/**
 * 检查当前用户是否具备任一指定权限
 */
export function useCanAny(required: string[]): boolean {
  const permissions = usePermissions()
  return useMemo(
    () => hasAnyPermission(permissions, required),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permissions, ...required]
  )
}
