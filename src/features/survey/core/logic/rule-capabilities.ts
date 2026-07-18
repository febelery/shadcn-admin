import { getQuestionDefinition } from '../question-definitions'
import type { QuestionElement, QuestionType } from '../types'

export function canUseQuestionTypeAsRuleSource(type: QuestionType): boolean {
  return getQuestionDefinition(type).ruleSource
}

export function canUseQuestionAsRuleSource(q: QuestionElement): boolean {
  if (!canUseQuestionTypeAsRuleSource(q.type)) return false
  if (getQuestionDefinition(q.type).family === 'choice') {
    return (q.config.options?.length ?? 0) > 0
  }
  return true
}

export function ruleSourceUnavailableReason(type: QuestionType): string {
  return (
    getQuestionDefinition(type).ruleSourceUnavailableReason ??
    '该题型当前不能作为条件题。'
  )
}
