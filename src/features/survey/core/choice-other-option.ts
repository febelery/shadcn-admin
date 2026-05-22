import { createQuestionId } from './schema-defaults'
import type { ChoiceOption } from './types'

export const DEFAULT_OTHER_LABEL = '其他（请说明）'
export const DEFAULT_OTHER_PLACEHOLDER = '请填写具体内容'

export function isOtherOption(option: ChoiceOption) {
  return option.isOther === true
}

/** 分离「其他」与普通选项 */
export function partitionChoiceOptions(options: ChoiceOption[]) {
  const regular: ChoiceOption[] = []
  let other: ChoiceOption | undefined
  for (const o of options) {
    if (isOtherOption(o)) other = o
    else regular.push(o)
  }
  return { regular, other }
}

/** 根据开关同步「其他」选项 */
export function syncOtherChoiceOption(
  options: ChoiceOption[],
  allowOther: boolean,
  otherLabel = DEFAULT_OTHER_LABEL
): ChoiceOption[] {
  const { regular, other } = partitionChoiceOptions(options)
  if (!allowOther) return regular
  return [
    ...regular,
    other ?? {
      id: createQuestionId(),
      label: otherLabel,
      isOther: true,
    },
  ]
}
