import { createQuestionId } from '../core/schema-defaults'
import type { ChoiceOption } from '../core/types'
import { clampText } from './label-limits'

type ParseOptions = {
  labelMaxLength?: number
  /** 追加模式：用于默认文案「选项 N」的起始序号 */
  startIndex?: number
}

/** 批量文本 → 选项列表（每行一项） */
export function parseOptionLines(
  text: string,
  opts: ParseOptions = {}
): ChoiceOption[] {
  const labelMaxLength = opts.labelMaxLength ?? 200
  const startIndex = opts.startIndex ?? 0

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const fallback = `选项 ${startIndex + i + 1}`
      const label = clampText(line.split('\t')[0]?.trim() ?? '', labelMaxLength) || fallback
      return {
        id: createQuestionId(),
        label,
      }
    })
}

/** 选项列表 → 批量编辑文本（与 parseOptionLines 互逆） */
export function optionsToLines(options: ChoiceOption[]): string {
  return options.map((o) => o.label).join('\n')
}

/** 追加模式：只取相对基线多出来的行 */
export function sliceLinesForAppend(
  batchText: string,
  baselineText: string
): string {
  const baselineCount = baselineText
    .split(/\r?\n/)
    .filter((l) => l.trim()).length
  return batchText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(baselineCount)
    .join('\n')
}

/** 常用选项模板（每行一项） */
export const OPTION_LINE_PRESETS = {
  yesNo: '是\n否',
  gender: '男\n女\n其他',
  satisfaction5: '非常不满意\n不满意\n一般\n满意\n非常满意',
  frequency5: '从不\n很少\n有时\n经常\n总是',
} as const
