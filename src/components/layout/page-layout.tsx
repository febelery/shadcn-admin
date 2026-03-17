import { Suspense } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/error-boundary'
import { PageHeader } from './page-header'

/**
 * default — 居中 + 最大宽度约束（常规内容页）
 * fluid   — 撑满容器宽度（数据密集型页面）
 * fixed   — 固定高度，内容区自行处理滚动（编辑器、地图、看板）
 */
type LayoutVariant = 'default' | 'fluid' | 'fixed'

interface PageLayoutProps {
  title?: string
  description?: string
  actions?: React.ReactNode
  variant?: LayoutVariant
  className?: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

const variantClassName: Record<LayoutVariant, string | null> = {
  default: '@7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl',
  fluid: null,
  fixed: 'flex grow flex-col overflow-hidden',
}

const variantDataLayout: Record<LayoutVariant, string> = {
  default: 'auto',
  fluid: 'fluid',
  fixed: 'fixed',
}

/**
 * 页面级通用骨架屏
 */
export function PageSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='flex items-end justify-between gap-2'>
        <div className='space-y-2'>
          <Skeleton shimmer className='h-7 w-48' />
          <Skeleton shimmer className='h-4 w-72 opacity-60' />
        </div>
        <Skeleton shimmer className='h-9 w-24 rounded-md' />
      </div>
      <Skeleton shimmer className='h-10 w-full rounded-md' />
      <div className='space-y-2'>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            shimmer
            className='h-12 w-full rounded-md'
            style={{ opacity: 1 - i * 0.08 }}
          />
        ))}
      </div>
    </div>
  )
}

const DEFAULT_FALLBACK = <PageSkeleton />

/**
 * 标准页面布局容器，提供统一的页眉 + 内容区结构。
 *
 * - ErrorBoundary 包裹整个内容区（含 PageHeader.actions），防止外部传入节点的异常向上冒泡到布局层。
 * - Suspense 统一管理加载态，fallback 与正式内容共享相同的宽度约束。
 */
export function PageLayout({
  title,
  description,
  actions,
  variant = 'default',
  className,
  fallback = DEFAULT_FALLBACK,
  children,
}: PageLayoutProps) {
  return (
    <main
      data-layout={variantDataLayout[variant]}
      className={cn('px-4 py-6', variantClassName[variant], className)}
    >
      <ErrorBoundary>
        {title && (
          <PageHeader title={title} description={description}>
            {actions}
          </PageHeader>
        )}
        <Suspense fallback={fallback}>{children}</Suspense>
      </ErrorBoundary>
    </main>
  )
}
