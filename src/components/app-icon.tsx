import { appConfig } from '@/config/env'
import { Command } from 'lucide-react'
import { cn } from '@/lib/utils'

type AppIconProps = {
  className?: string
}

/**
 * 应用图标组件
 *
 * 根据 VITE_APP_ICON 环境变量决定显示方式：
 * - 如果设置了 VITE_APP_ICON，则显示图片
 * - 否则显示 Command 图标作为默认图标
 * - 当 withContainer 为 true 且无图片时，显示带容器的 Command 图标
 */
export function AppIcon({ className }: AppIconProps) {
  const iconUrl = appConfig.icon

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt='App Icon'
        className={cn(
          'flex aspect-square size-8 items-center justify-center rounded-lg',
          className
        )}
      />
    )
  }

  // 没有图片时，显示容器
  return (
    <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
      <Command className={cn('size-4', className)} />
    </div>
  )
}
