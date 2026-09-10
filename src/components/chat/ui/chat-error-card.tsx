import { useState } from 'react'
import { cn } from 'cn'
import { AlertCircle, ChevronDown, RotateCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ChatErrorCardProps {
  error: Error
  onRetry?: () => void
  onDismiss?: () => void
}

/**
 * 友好、结构化的错误提示卡片
 */
export function ChatErrorCard({
  error,
  onRetry,
  onDismiss,
}: ChatErrorCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const isLong = error.message.length > 80 || Boolean(error.stack)

  return (
    <div className='bg-destructive/5 border-destructive/20 mx-auto my-3 w-full max-w-3xl rounded-2xl border p-4 shadow-2xs transition-all'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex min-w-0 items-start gap-3'>
          <div className='bg-destructive/15 text-destructive ring-destructive/25 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ring-1'>
            <AlertCircle className='size-4' />
          </div>
          <div className='min-w-0 space-y-1'>
            <h4 className='text-destructive text-xs font-semibold sm:text-sm'>
              生成回复时遇到问题
            </h4>
            <p className='text-muted-foreground text-xs leading-relaxed break-words'>
              {error.message}
            </p>
          </div>
        </div>

        <div className='flex shrink-0 items-center gap-1.5'>
          {onRetry && (
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={onRetry}
              className='hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 h-7.5 cursor-pointer px-2.5 text-xs font-medium shadow-2xs'
            >
              <RotateCw className='mr-1.5 size-3' />
              重试
            </Button>
          )}
          {onDismiss && (
            <Button
              type='button'
              size='icon'
              variant='ghost'
              onClick={onDismiss}
              className='text-muted-foreground hover:text-foreground size-7.5 cursor-pointer'
              title='忽略错误'
              aria-label='忽略错误'
            >
              <X className='size-3.5' />
            </Button>
          )}
        </div>
      </div>

      {isLong && (
        <div className='border-destructive/10 mt-3 border-t pt-2.5'>
          <button
            type='button'
            onClick={() => setShowDetails((prev) => !prev)}
            className='text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium transition-colors select-none'
          >
            <span>{showDetails ? '收起技术详情' : '查看技术详情'}</span>
            <ChevronDown
              className={cn(
                'size-3 transition-transform duration-200',
                showDetails && 'rotate-180'
              )}
            />
          </button>
          {showDetails && (
            <pre className='bg-muted/60 text-muted-foreground mt-2 max-h-40 overflow-auto rounded-lg p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-all'>
              {error.stack || error.message}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
