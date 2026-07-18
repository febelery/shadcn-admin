import type { QuestionElement, QuestionType } from '../types'

export type RuleOperatorProfile =
  'choice' | 'multiple-choice' | 'text' | 'number' | 'date' | 'none'

const RULE_OPERATOR_PROFILES = {
  single_choice: 'choice',
  multiple_choice: 'multiple-choice',
  dropdown: 'choice',
  ranking: 'none',
  matrix_single: 'none',
  matrix_multiple: 'none',
  cascader: 'none',
  text: 'text',
  textarea: 'text',
  number: 'number',
  email: 'text',
  phone: 'text',
  url: 'text',
  date: 'date',
  date_range: 'none',
  rating: 'number',
  slider: 'number',
  nps: 'number',
  likert: 'none',
  file_upload: 'none',
} satisfies Record<QuestionType, RuleOperatorProfile>

export function getRuleOperatorProfile(
  type: QuestionType
): RuleOperatorProfile {
  return RULE_OPERATOR_PROFILES[type]
}

export function canUseQuestionTypeAsRuleSource(type: QuestionType): boolean {
  return getRuleOperatorProfile(type) !== 'none'
}

export function canUseQuestionAsRuleSource(question: QuestionElement): boolean {
  const profile = getRuleOperatorProfile(question.type)
  if (profile === 'none') return false
  if (profile === 'choice' || profile === 'multiple-choice') {
    return (question.config.options?.length ?? 0) > 0
  }
  return true
}
