/**
 * 权限匹配工具
 *
 * 权限字符串格式：`resource:action`，与后端 Casbin policy 一致。
 * 支持通配符匹配：
 *   - `*`           → 匹配一切权限
 *   - `users:*`     → 匹配 users 下所有 action
 *   - `users:access` → 精确匹配
 */

/**
 * 判断单个权限字符串是否命中目标权限
 */
function matchSingle(held: string, required: string): boolean {
  // 全局通配
  if (held === '*') return true

  // resource 级通配：held = "users:*", required = "users:access"
  if (held.endsWith(':*')) {
    const heldResource = held.slice(0, -2) // "users"
    const requiredResource = required.split(':')[0]
    return heldResource === requiredResource
  }

  // 精确匹配
  return held === required
}

/**
 * 检查用户权限列表是否满足某个权限要求
 *
 * @param permissions - 用户持有的权限数组（来自后端）
 * @param required - 需要检查的权限字符串，如 "users:access"
 * @returns 是否具备该权限
 *
 * @example
 * ```ts
 * hasPermission(['*'], 'users:access')           // true（超管）
 * hasPermission(['users:*'], 'users:access')      // true（users 模块全权限）
 * hasPermission(['users:access'], 'users:access') // true（精确命中）
 * hasPermission(['tasks:access'], 'users:access') // false
 * ```
 */
export function hasPermission(
  permissions: string[],
  required: string
): boolean {
  return permissions.some((held) => matchSingle(held, required))
}

/**
 * 检查用户权限列表是否满足所有权限要求
 */
export function hasAllPermissions(
  permissions: string[],
  required: string[]
): boolean {
  return required.every((r) => hasPermission(permissions, r))
}

/**
 * 检查用户权限列表是否满足任一权限要求
 */
export function hasAnyPermission(
  permissions: string[],
  required: string[]
): boolean {
  return required.some((r) => hasPermission(permissions, r))
}
