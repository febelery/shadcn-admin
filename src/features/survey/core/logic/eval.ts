import type { QuestionElement } from '../types'
import type { ConditionOperator } from './operators'

/** 判定回答是否为空 */
export function isEmptyAnswer(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  return false
}

/** 统一规范化回答值（例如处理数值型、数组型等） */
export function normalizeAnswerValue(question: QuestionElement, value: unknown): unknown {
  if (value === undefined || value === null) return value
  if (Array.isArray(value)) return value.map(String)
  if (
    question.type === 'number' ||
    question.type === 'rating' ||
    question.type === 'slider' ||
    question.type === 'nps'
  ) {
    const num = Number(value)
    return Number.isFinite(num) ? num : value
  }
  return String(value)
}

/** 通用答卷条件判定求值引擎 */
export function evaluateCondition(
  answer: unknown,
  question: QuestionElement,
  operator: ConditionOperator,
  value: unknown,
  value2?: unknown
): boolean {
  if (operator === 'empty') return isEmptyAnswer(answer)
  if (operator === 'not_empty') return !isEmptyAnswer(answer)
  if (isEmptyAnswer(answer)) return false

  const normalizedAnswer = normalizeAnswerValue(question, answer)

  if (Array.isArray(normalizedAnswer)) {
    const list = normalizedAnswer.map(String)
    const expected = String(value ?? '')
    if (operator === 'contains') return list.includes(expected)
    if (operator === 'not_contains') return !list.includes(expected)
    if (operator === 'eq') return list.length === 1 && list[0] === expected
    if (operator === 'neq') return !(list.length === 1 && list[0] === expected)
    return false
  }

  if (typeof normalizedAnswer === 'number') {
    const expected = Number(value)
    const expected2 = Number(value2)
    if (!Number.isFinite(expected)) return false
    switch (operator) {
      case 'eq':
        return normalizedAnswer === expected
      case 'neq':
        return normalizedAnswer !== expected
      case 'gt':
        return normalizedAnswer > expected
      case 'gte':
        return normalizedAnswer >= expected
      case 'lt':
        return normalizedAnswer < expected
      case 'lte':
        return normalizedAnswer <= expected
      case 'between':
        return (
          Number.isFinite(expected2) &&
          normalizedAnswer >= expected &&
          normalizedAnswer <= expected2
        )
      default:
        return false
    }
  }

  const actual = String(normalizedAnswer)
  const expected = String(value ?? '')
  switch (operator) {
    case 'eq':
      return actual === expected
    case 'neq':
      return actual !== expected
    case 'contains':
      return actual.includes(expected)
    case 'not_contains':
      return !actual.includes(expected)
    default:
      return false
  }
}
