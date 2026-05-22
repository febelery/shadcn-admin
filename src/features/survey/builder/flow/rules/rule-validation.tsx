import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StaticIssue } from '../../types'

type Props = {
  issues: StaticIssue[]
  /** 紧凑模式：嵌入编辑器上方 */
  compact?: boolean
}

/** 单条规则的校验结果 — 显示在右栏编辑器上方 */
export function RuleValidation({ issues, compact }: Props) {
  if (issues.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 border-b border-emerald-500/20 bg-emerald-500/5',
          compact ? 'px-4 py-2' : 'px-4 py-2.5'
        )}
      >
        <CheckCircle2 className='size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400' />
        <span
          className={cn(
            'text-xs leading-none',
            'text-emerald-700 dark:text-emerald-400'
          )}
        >
          此规则配置正确
        </span>
      </div>
    )
  }

  const hasError = issues.some((i) => i.severity === 'error')

  return (
    <div
      className={cn(
        'border-b',
        hasError
          ? 'border-destructive/25 bg-destructive/5'
          : 'border-amber-500/25 bg-amber-500/5',
        compact ? 'px-4 py-2' : 'px-4 py-2.5'
      )}
    >
      <div className='mb-1.5 flex items-center gap-1.5'>
        {hasError ? (
          <AlertCircle className='text-destructive size-3.5 shrink-0' />
        ) : (
          <AlertTriangle className='size-3.5 shrink-0 text-amber-600 dark:text-amber-400' />
        )}
        <span
          className={cn(
            'text-xs leading-none',
            'font-medium',
            hasError ? 'text-destructive' : 'text-amber-700 dark:text-amber-400'
          )}
        >
          {hasError ? '此规则需要修复' : '此规则有警告'}
        </span>
      </div>
      <ul className='flex flex-col gap-1'>
        {issues.map((i, idx) => (
          <li
            key={`${i.code}-${idx}`}
            className={cn(
              'text-muted-foreground text-xs leading-relaxed',
              'flex items-start gap-1.5 pl-5',
              i.severity === 'error'
                ? 'text-destructive'
                : 'text-amber-700 dark:text-amber-400'
            )}
          >
            <span className='mt-1.5 size-1 shrink-0 rounded-full bg-current' />
            <span className='min-w-0 break-words'>{i.message}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
