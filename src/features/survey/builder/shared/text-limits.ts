/** Builder text limits keep editable content within the supported UI contract. */
export const BUILDER_TEXT_LIMITS = {
  matrixRow: 80,
  matrixColumn: 40,
  choiceOption: 200,
  questionTitle: 300,
  questionDescription: 1000,
  surveyTitle: 120,
  surveyDescription: 2000,
  likertStatement: 200,
  cascaderOption: 80,
  npsLabel: 80,
  placeholder: 120,
} as const

export function limitText(text: string, maxLength: number): string {
  if (maxLength <= 0 || text.length <= maxLength) return text
  return text.slice(0, maxLength)
}
