import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { questionRequiredBadge, questionRequiredColumn } from './question-layout'

/** 画布必/选徽章 — 点击时不触发题目选中 */
export const QUESTION_REQUIRED_TOGGLE_ATTR = 'data-question-required-toggle'

type Props = {
  required: boolean
  /**
   * builder：必/选 徽章（设计器画布）
   * fill：仅必填显示 *（填答预览，业界惯例）
   */
  mode?: 'builder' | 'fill'
  /** 画布内点击切换必填 */
  onToggle?: () => void
}

function RequiredBadge({ required }: { required: boolean }) {
  return (
    <span
      className={cn(
        questionRequiredBadge,
        required ? 'text-destructive' : 'text-muted-foreground/55'
      )}
    >
      {required ? '必' : '选'}
    </span>
  )
}

function RequiredAsterisk() {
  return (
    <span className='text-destructive text-base font-semibold leading-none'>
      *
    </span>
  )
}

function RequiredMarkGlyph({
  required,
  mode,
}: {
  required: boolean
  mode: 'builder' | 'fill'
}) {
  if (mode === 'fill') {
    return required ? <RequiredAsterisk /> : null
  }
  return <RequiredBadge required={required} />
}

/** 必填标记 — 固定占位；画布可点击切换 */
export function QuestionRequiredMark({
  required,
  mode = 'builder',
  onToggle,
}: Props) {
  const label = required ? '取消必填' : '设为必填'

  // 填答模式且非必填：不占位
  if (mode === 'fill' && !required) {
    return <span className={questionRequiredColumn} aria-hidden />
  }

  const glyph = <RequiredMarkGlyph required={required} mode={mode} />

  if (onToggle) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type='button'
            {...{ [QUESTION_REQUIRED_TOGGLE_ATTR]: '' }}
            className={cn(
              questionRequiredColumn,
              'rounded-sm transition-colors hover:bg-muted/70',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
            )}
            aria-label={label}
            aria-pressed={required}
            onPointerDown={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {glyph}
          </button>
        </TooltipTrigger>
        <TooltipContent side='top' className='text-xs'>
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <span className={questionRequiredColumn} aria-hidden={mode === 'fill' && !required}>
      {glyph}
    </span>
  )
}
