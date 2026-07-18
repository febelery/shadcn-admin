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

/** 设置选项列表是否包含「其他」自填项。 */
export function setOtherChoiceOptionEnabled(
  options: ChoiceOption[],
  enabled: boolean,
  label = DEFAULT_OTHER_LABEL
): ChoiceOption[] {
  const { regular, other } = partitionChoiceOptions(options)
  if (!enabled) return regular
  return [
    ...regular,
    other ?? {
      id: crypto.randomUUID(),
      label,
      isOther: true,
    },
  ]
}
