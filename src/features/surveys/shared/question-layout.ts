import { cn } from '@/lib/utils'

/** 题目块排版 token — 画布与预览共用（参考试卷悬挂缩进） */

export const questionTitleText =
  'text-foreground text-base font-semibold leading-snug tracking-tight'

export const questionNumberText =
  'text-foreground shrink-0 text-base font-semibold leading-snug tabular-nums'

/** 中文题号等宽字：不用 tabular-nums，避免挤压 */
export const questionNumberTextWide =
  'text-foreground shrink-0 text-base font-semibold leading-snug'

/** 与题目标题 text-base leading-snug 一致的首行高度 */
export const questionHeaderLineHeight = 'min-h-[1.375rem]'

/** 必/选 徽章格：固定宽高，切换时不抖动 */
export const questionRequiredColumn =
  'inline-flex w-4 shrink-0 items-center justify-center'

/** 画布必/选：文字标记，避免像可点击按钮 */
export const questionRequiredBadge =
  'inline-flex size-4 items-center justify-center text-[10px] font-semibold leading-none tabular-nums'

/** 题号格：基础 2ch 占位，更长题号（罗马/中文等）由 w-max 随内容撑开 */
export const questionNumberColumn =
  'inline-flex w-max min-w-[2ch] shrink-0 items-center justify-start whitespace-nowrap text-left'

/** 前缀列（必/选 + 题号）+ 正文列；首列 auto 适配长题号（如「二十三、」） */
export const questionBlockGrid =
  'grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-1.5'

export const questionBlockGridRequiredOnly =
  'grid grid-cols-[1rem_minmax(0,1fr)] items-start gap-x-1 gap-y-1.5'

export const questionBlockStack = 'flex min-w-0 flex-col gap-1.5'

/** 有题号时正文列（标题 / 说明 / 选项共用） */
export const questionBlockContentCol = 'col-start-2 min-w-0'

export const questionOptionsWrap = 'flex min-w-0 flex-col gap-1.5'

/** 前缀区：徽章与题号在同一行高内垂直居中 */
export const questionPrefixCluster = cn(
  'flex w-max max-w-full shrink-0 items-center gap-x-1',
  questionHeaderLineHeight
)
