/**
 * 问卷设计器视觉规范 — 单一来源（布局 + 排版 + 间距）。
 *
 * 三层空间：
 * - Chrome：顶栏、侧栏（扁平工具区）
 * - Canvas：工作区底色（衬托文档）
 * - Document：问卷预览卡片（视觉焦点，唯一主 elevation）
 *
 * 排版：只用 builderType*，禁止 inline text-[11px] / 散落 text-xs。
 */
import { cn } from '@/lib/utils'

// ─── Typography ─────────────────────────────────────────────────────────────

/** 问卷文档标题（封面 WYSIWYG） */
export const builderTypeDisplay =
  'text-xl font-semibold tracking-tight leading-tight sm:text-2xl'

/** 顶栏问卷名 */
export const builderTypeChromeTitle =
  'text-base font-semibold tracking-tight leading-none placeholder:text-muted-foreground/50'

/** 三栏面板标题 */
export const builderTypeHeadline =
  'text-sm font-semibold tracking-tight leading-none'

/** 三栏面板副标题 */
export const builderTypeSubhead = 'text-xs leading-snug text-muted-foreground'

/** 侧栏分区标签（题型分类等） */
export const builderTypeOverline =
  'text-xs font-medium uppercase tracking-wider text-muted-foreground'

/** 正文、题干 */
export const builderTypeBody = 'text-sm leading-relaxed'

/** 作答区控件预览（画布 WYSIWYG，略高于正文） */
export const builderTypeAnswer = 'text-[15px] leading-relaxed'

/** Inspector 表单标签 */
export const builderTypeLabel = 'text-xs font-medium text-muted-foreground'

/** 辅助说明、hint */
export const builderTypeCaption =
  'text-xs leading-relaxed text-muted-foreground'

/** 紧凑条目、Tabs、控件内文字 */
export const builderTypeMicro = 'text-xs leading-none'

/** 等宽代码（slug、色值） */
export const builderTypeMono =
  'font-mono text-xs tabular-nums leading-none text-muted-foreground'

/** 顶栏状态（新建 / 未保存） */
export const builderTypeStatus = 'text-xs tabular-nums text-muted-foreground'

/** 表单控件字号（Input / Select trigger） */
export const builderTypeControl = builderTypeMicro

/** 错误提示 */
export const builderTypeError = 'text-xs leading-relaxed text-destructive'

// ─── Spacing（4pt 网格） ────────────────────────────────────────────────────

export const builderSpaceSection = 'gap-4'
export const builderSpaceForm = 'gap-3'
export const builderSpaceTight = 'gap-1.5'
const builderSpaceField = 'gap-1'

// ─── Chrome ─────────────────────────────────────────────────────────────────

export const builderRoot = 'bg-background flex h-svh flex-col antialiased'

export const builderTopBar = cn(
  'relative flex h-14 shrink-0 items-center gap-3 border-b border-border px-4',
  'bg-background/80 backdrop-blur-sm supports-backdrop-filter:bg-background/70'
)

/** 顶栏居中状态区（新建 / 未保存） */
export const builderTopBarStatusCenter = cn(
  'pointer-events-none absolute inset-x-0 hidden items-center justify-center sm:flex'
)

export const builderWorkspace = 'flex min-h-0 flex-1 overflow-hidden'

const builderShellColumn =
  'flex min-h-0 min-w-0 flex-col overflow-hidden'

const builderSidePanelChrome = 'bg-muted/35'

export const builderPanelPalette = cn(
  builderShellColumn,
  'w-72 shrink-0 border-r border-border',
  builderSidePanelChrome
)

/** 侧栏内容区 — 前景表面，与 Chrome 分层 */
export const builderSidePanelBody = cn(
  'bg-background text-foreground flex min-h-0 min-w-0 flex-1 flex-col'
)

export const builderPanelInspector = cn(
  builderShellColumn,
  'w-80 shrink-0 border-l border-border',
  builderSidePanelChrome
)

export const builderPanelScroll = 'min-h-0 flex-1'

export const builderPaletteGrid = 'grid grid-cols-2 gap-1.5 px-2'

export const builderPaletteItem = cn(
  'group h-9 w-full justify-start gap-2 rounded-md px-2 font-normal',
  'text-foreground hover:bg-muted/60 hover:text-foreground',
  'transition-colors duration-150'
)

export const builderPaletteIcon = cn(
  'bg-muted text-foreground flex size-7 shrink-0 items-center justify-center rounded-md border border-border/50',
  'transition-colors group-hover:border-border group-hover:bg-accent group-hover:text-accent-foreground'
)

export const builderPanelHeaderBar = cn(
  'flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-4',
  'bg-muted/60'
)

/** 题型库搜索区 */
export const builderPaletteSearch = 'border-b border-border px-3 py-2'

export const builderPaletteSearchField = 'relative'

export const builderPaletteSearchIcon = cn(
  'text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2'
)

export const builderPaletteSearchInput = cn(
  builderTypeControl,
  'h-8 border-input bg-background pe-9 shadow-xs',
  'focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[2px]'
)

// ─── Canvas ─────────────────────────────────────────────────────────────────

export const builderWorkspaceArea = cn(
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
  'bg-linear-to-b from-background via-muted/25 to-muted/40'
)

export const builderWorkspaceScroll =
  'min-h-0 flex-1 overflow-y-auto pb-[calc(3.25rem+env(safe-area-inset-bottom))] lg:pb-0'

export const builderWorkspaceInner =
  'mx-auto flex w-full max-w-3xl flex-col px-3 py-5 sm:px-5 sm:py-6 md:px-8 md:py-8'

export const builderGuidanceCanvas = cn(
  'flex flex-1 flex-col items-center justify-center py-20 text-center',
  builderSpaceTight
)

export const builderGuidancePanel = cn(
  'flex flex-col items-center justify-center py-10 text-center',
  builderSpaceTight
)

export const builderMobileDock = cn(
  'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center',
  'border-t border-border bg-background/90 p-2 backdrop-blur-md',
  'pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden'
)

// ─── Document ───────────────────────────────────────────────────────────────

export const builderSurveyFrame = cn(
  'bg-card text-card-foreground w-full overflow-hidden rounded-xl',
  'border border-border/80 shadow-md'
)

export const builderSurveyBody =
  'flex min-h-[320px] min-w-0 flex-col overflow-x-hidden px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12'

export const builderQuestionList = 'flex flex-col gap-1'

// ─── 题块与拖放 ─────────────────────────────────────────────────────────────

export function builderInsertPlaceholder(active: boolean) {
  return cn(
    'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-3',
    builderTypeMicro,
    'font-medium transition-colors duration-150',
    active
      ? 'border-primary bg-primary/5 text-foreground'
      : 'border-border text-muted-foreground'
  )
}

export function builderQuestionBlockClass(opts: {
  selected?: boolean
  dragging?: boolean
  dimmed?: boolean
}) {
  return cn(
    'group/question relative rounded-lg border border-transparent',
    'transition-[background-color,border-color,box-shadow,opacity] duration-150',
    opts.selected
      ? 'border-border/50 bg-background shadow-sm before:absolute before:top-2.5 before:bottom-2.5 before:left-0 before:w-0.5 before:rounded-r before:bg-primary before:content-[""]'
      : 'hover:bg-muted/30',
    opts.dragging && 'opacity-40',
    opts.dimmed && !opts.dragging && 'opacity-35'
  )
}

export const builderQuestionBodyPad = 'px-3.5 py-3 pr-11'

export function builderQuestionActions(selected?: boolean) {
  return cn(
    'pointer-events-none absolute top-2.5 right-2 z-10',
    'transition-[opacity,transform] duration-150',
    selected
      ? 'pointer-events-auto translate-y-0 opacity-100'
      : 'translate-y-0.5 opacity-0 group-hover/question:pointer-events-auto group-hover/question:translate-y-0 group-hover/question:opacity-100 group-focus-within/question:pointer-events-auto group-focus-within/question:translate-y-0 group-focus-within/question:opacity-100'
  )
}

export function builderWorkspaceAddDropTarget(isOver?: boolean) {
  return cn(
    'shrink-0 rounded-lg border border-dashed px-3 py-2',
    builderTypeMicro,
    'text-muted-foreground transition-colors duration-150',
    'border-border/60 bg-muted/20',
    isOver && 'border-primary bg-primary/5 text-foreground'
  )
}

export const builderWorkspaceAddHint = cn(
  builderTypeCaption,
  'shrink-0 select-none px-2 leading-none opacity-70'
)

// ─── Inspector ──────────────────────────────────────────────────────────────

export const builderInspectorForm = cn(
  'flex min-w-0 max-w-full flex-col overflow-x-hidden',
  builderSpaceSection
)

export const builderSettingsRoot = cn('flex flex-col', builderSpaceForm)

export const builderInspectorGroup = cn(
  'flex flex-col rounded-lg border border-border/60 bg-muted/20 p-3.5',
  builderSpaceForm
)

export const builderFieldStack = cn('flex flex-col', builderSpaceField)
