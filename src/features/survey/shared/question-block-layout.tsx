import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  questionBlockContentCol,
  questionBlockGrid,
  questionBlockGridRequiredOnly,
  questionBlockStack,
  questionNumberColumn,
  questionOptionsWrap,
  questionHeaderLineHeight,
  questionPrefixCluster,
} from './question-layout'
import { QuestionRequiredMark } from './question-required-mark'

type Props = {
  required?: boolean
  /** 覆盖默认必填星号（如画布可点击切换） */
  requiredMark?: ReactNode
  /** 题号内容；无内容时仍保留题号格 */
  numberSlot?: ReactNode | null
  /**
   * 全卷启用题号时设为 true：保留题号列占位，隐藏题号/切换必填不抖动。
   */
  reserveNumberColumn?: boolean
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * 试卷式悬挂缩进：[必/选][题号] 前缀列自适应宽度 + 正文列。
 */
export function QuestionBlockLayout({
  required = false,
  requiredMark,
  numberSlot,
  reserveNumberColumn = false,
  title,
  description,
  children,
  className,
}: Props) {
  const useNumberGrid = reserveNumberColumn || numberSlot != null
  const mark = requiredMark ?? <QuestionRequiredMark required={required} />

  if (!useNumberGrid) {
    return (
      <div className={cn(questionBlockStack, className)}>
        <div className={questionBlockGridRequiredOnly}>
          {mark}
          <div
            className={cn(
              questionBlockContentCol,
              questionHeaderLineHeight,
              'flex min-w-0 items-center'
            )}
          >
            {title}
          </div>
        </div>
        {description}
        <div className={questionOptionsWrap}>{children}</div>
      </div>
    )
  }

  return (
    <div className={cn(questionBlockGrid, className)}>
      <div className={questionPrefixCluster}>
        {mark}
        {numberSlot ?? <span className={questionNumberColumn} aria-hidden />}
      </div>
      <div
        className={cn(questionBlockContentCol, 'flex min-w-0 flex-col gap-1.5')}
      >
        <div
          className={cn(questionHeaderLineHeight, 'flex min-w-0 items-center')}
        >
          {title}
        </div>
        {description}
        <div className={questionOptionsWrap}>{children}</div>
      </div>
    </div>
  )
}
