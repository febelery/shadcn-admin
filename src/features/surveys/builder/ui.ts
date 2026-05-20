/**
 * 问卷设计器布局
 */
import { cn } from '@/lib/utils'

export const builderTopBar =
  'flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4'

export const builderWorkspace = 'flex min-h-0 flex-1 overflow-hidden'

export const builderShellColumn =
  'flex min-h-0 min-w-0 flex-col overflow-hidden bg-background'

/** 题型库侧栏 — 与属性面板同色 */
export const builderPanelPalette = cn(
  builderShellColumn,
  'w-72 shrink-0 border-r border-border'
)

export const builderPaletteGrid = 'grid grid-cols-2 gap-1 px-1.5'

export const builderPanelInspector = cn(
  builderShellColumn,
  'w-80 shrink-0 border-l border-border'
)

export const builderPanelScroll = 'min-h-0 flex-1'

export const builderInspectorForm =
  'flex min-w-0 max-w-full flex-col gap-4 overflow-x-hidden'

/** 问卷设置面板 — 卡片分组列表 */
export const builderSettingsRoot = 'flex flex-col gap-3'

export const builderWorkspaceArea = cn(
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-muted/40'
)

export const builderWorkspaceScroll =
  'min-h-0 flex-1 overflow-y-auto pb-[calc(3.25rem+env(safe-area-inset-bottom))] lg:pb-0'

export const builderWorkspaceInner =
  'mx-auto flex w-full max-w-5xl flex-col gap-3 px-2 py-3 sm:gap-4 sm:px-4 sm:py-4 md:px-6 md:py-5 lg:px-8'

export const builderSurveyFrame = cn(
  'bg-card text-card-foreground w-full overflow-hidden rounded-lg shadow-sm'
)

/** 问卷正文区：适度内边距 */
export const builderSurveyBody =
  'flex min-h-[280px] min-w-0 flex-col overflow-x-hidden px-4 py-6 sm:min-h-[360px] sm:px-6 sm:py-8 md:px-10 md:py-10'

/** 题目列表：块之间留少量呼吸间距 */
export const builderQuestionList = 'flex flex-col gap-0.5'

export function builderInsertPlaceholder(active: boolean) {
  return cn(
    'flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-3 py-2.5 text-xs font-medium transition-colors',
    active
      ? 'border-primary bg-primary/5 text-foreground'
      : 'border-muted-foreground/25 text-muted-foreground'
  )
}

/** WYSIWYG 题目块：hover 轻背景；选中为左侧强调条 + 细描边 */
export function builderQuestionBlockClass(opts: {
  selected?: boolean
  dragging?: boolean
  dimmed?: boolean
}) {
  return cn(
    'group/question relative rounded-lg border border-transparent transition-[background-color,border-color,box-shadow]',
    opts.selected
      ? 'border-border/35 bg-background shadow-[0_1px_2px_hsl(0_0%_0%/0.04)] before:absolute before:top-2 before:bottom-2 before:left-0 before:w-0.5 before:rounded-r before:bg-primary/55 before:content-[""]'
      : 'hover:bg-muted/25',
    opts.dragging && 'opacity-40 transition-opacity',
    opts.dimmed && !opts.dragging && 'opacity-35 transition-opacity'
  )
}

/** 题目内容区内边距（右侧为浮层操作条留白） */
export const builderQuestionBodyPad = 'px-3 py-2.5 pr-10'

/** 右侧操作条：浮于块内右上角，不占 flex 宽度 */
export function builderQuestionActions(selected?: boolean) {
  return cn(
    'pointer-events-none absolute top-2 right-1.5 z-10 transition-[opacity,transform] duration-150',
    selected
      ? 'pointer-events-auto translate-y-0 opacity-100'
      : 'translate-y-0.5 opacity-0 group-hover/question:pointer-events-auto group-hover/question:translate-y-0 group-hover/question:opacity-100 group-focus-within/question:pointer-events-auto group-focus-within/question:translate-y-0 group-focus-within/question:opacity-100'
  )
}

export const builderQuestionContent = 'min-w-0 flex-1'

export const builderWorkspaceEmpty =
  'text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center'

/** 底部添加区：静止时的纯文字提示（不可点击） */
export const builderWorkspaceAddHint =
  'text-muted-foreground/70 shrink-0 select-none px-2 text-[11px] font-normal leading-none'

/** 底部添加区：拖拽题型时的放置反馈 */
export function builderWorkspaceAddDropTarget(isOver?: boolean) {
  return cn(
    'text-muted-foreground shrink-0 rounded-md border border-dashed px-3 py-1.5 text-xs transition-colors',
    'border-border/60 bg-muted/20',
    isOver && 'border-primary bg-primary/5 text-foreground'
  )
}
