/** 画布/属性面板文案长度上限 — 防止撑破布局 */
export const LABEL_LIMITS = {
  matrixRow: 80,
  matrixCol: 40,
  choiceOption: 200,
  questionTitle: 300,
  questionDescription: 1000,
  surveyTitle: 120,
  surveyDescription: 2000,
  sectionTitle: 120,
  sectionDescription: 500,
  likertStatement: 200,
  cascaderOption: 80,
  npsLabel: 80,
  customNumber: 24,
  placeholder: 120,
} as const

export function clampText(text: string, max: number): string {
  if (max <= 0 || text.length <= max) return text
  return text.slice(0, max)
}
