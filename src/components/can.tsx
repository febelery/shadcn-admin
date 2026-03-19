import { type ReactNode } from 'react'
import { useCan } from '@/hooks/use-permissions'

/**
 * `<Can>` 权限守卫组件
 *
 * 支持三种模式：
 * - **hide**（默认）：无权限时隐藏子节点
 * - **disable**：无权限时渲染子节点但禁用交互（需要子节点支持 disabled prop）
 * - **fallback**：无权限时渲染降级内容
 *
 * @example
 * ```tsx
 * // 隐藏模式
 * <Can permission="users:create">
 *   <Button>新增用户</Button>
 * </Can>
 *
 * // 禁用模式
 * <Can permission="users:delete" mode="disable">
 *   <Button>删除用户</Button>
 * </Can>
 *
 * // 降级模式
 * <Can permission="analytics:access" fallback={<UpgradePrompt />}>
 *   <AnalyticsDashboard />
 * </Can>
 * ```
 */

type CanMode = 'hide' | 'disable' | 'fallback'

interface CanProps {
  /** 需要的权限字符串，如 "users:access" */
  permission: string
  /** 控制模式，默认 "hide" */
  mode?: CanMode
  /** mode 为 "fallback" 时显示的降级内容 */
  fallback?: ReactNode
  children: ReactNode
}

export function Can({
  permission,
  mode = 'hide',
  fallback = null,
  children,
}: CanProps) {
  const allowed = useCan(permission)

  if (allowed) return <>{children}</>

  switch (mode) {
    case 'disable':
      // 利用 CSS pointer-events 与 opacity 实现通用禁用
      return (
        <div
          style={{ pointerEvents: 'none', opacity: 0.5 }}
          aria-disabled='true'
          title='您没有此操作的权限'
        >
          {children}
        </div>
      )

    case 'fallback':
      return <>{fallback}</>

    case 'hide':
    default:
      return null
  }
}
