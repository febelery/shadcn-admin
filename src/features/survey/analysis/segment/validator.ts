import type {
  SegmentCondition,
  SegmentDefinition,
} from '@/features/survey/core/analysis-schema'
import { getRuleOperatorProfile } from '@/features/survey/core/logic/rule-capabilities'
import type { QuestionElement } from '@/features/survey/core/types'
import {
  getOperators,
  operatorNeedsValue,
  operatorNeedsSecondValue,
} from './utils'

export type ValidationSeverity = 'error' | 'warning'

export interface ValidationIssue {
  id: string
  segmentId: string
  conditionIndex: number
  severity: ValidationSeverity
  message: string
}

export function getConditionIssues(
  segments: SegmentDefinition[],
  questionMap: Map<string, QuestionElement>
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  segments.forEach((segment) => {
    const questionBuckets = new Map<
      string,
      {
        question: QuestionElement
        items: { condition: SegmentCondition; index: number }[]
      }
    >()

    segment.conditions.forEach((condition, index) => {
      const question = questionMap.get(condition.questionId)
      if (!condition.questionId) {
        return
      }

      if (!question) {
        issues.push({
          id: `${segment.id}-${index}-missing`,
          segmentId: segment.id,
          conditionIndex: index,
          severity: 'error',
          message: '该题目不可用于条件统计',
        })
        return
      }

      if (!getOperators(question).includes(condition.operator)) {
        issues.push({
          id: `${segment.id}-${index}-operator`,
          segmentId: segment.id,
          conditionIndex: index,
          severity: 'error',
          message: '当前题型不支持该操作符',
        })
        return
      }

      if (operatorNeedsValue(condition.operator)) {
        if (condition.value === undefined || condition.value === '') {
          issues.push({
            id: `${segment.id}-${index}-value`,
            segmentId: segment.id,
            conditionIndex: index,
            severity: 'error',
            message: '请填写条件值',
          })
          return
        }
        if (
          operatorNeedsSecondValue(condition.operator) &&
          (condition.value2 === undefined || condition.value2 === '')
        ) {
          issues.push({
            id: `${segment.id}-${index}-value2`,
            segmentId: segment.id,
            conditionIndex: index,
            severity: 'error',
            message: '请填写区间上限',
          })
          return
        }
      }

      const bucket = questionBuckets.get(condition.questionId)
      if (bucket) {
        bucket.items.push({ condition, index })
      } else {
        questionBuckets.set(condition.questionId, {
          question,
          items: [{ condition, index }],
        })
      }
    })

    for (const bucket of questionBuckets.values()) {
      const conflictMessage = detectQuestionConflict(
        bucket.question,
        bucket.items
      )
      if (!conflictMessage) continue
      bucket.items.forEach(({ index }) => {
        issues.push({
          id: `${segment.id}-${index}-conflict`,
          segmentId: segment.id,
          conditionIndex: index,
          severity: 'error',
          message: conflictMessage,
        })
      })
    }
  })

  return issues
}

export function detectQuestionConflict(
  question: QuestionElement,
  items: { condition: SegmentCondition }[]
): string | null {
  const conditions = items.map((item) => item.condition)

  const hasEmpty = conditions.some(
    (condition) => condition.operator === 'empty'
  )
  const hasNotEmpty = conditions.some(
    (condition) => condition.operator === 'not_empty'
  )
  if (hasEmpty && conditions.length > 1) {
    return '“为空”不能和其他条件同时成立'
  }
  if (hasEmpty && hasNotEmpty) {
    return '“为空”和“不为空”互相冲突'
  }

  const operatorProfile = getRuleOperatorProfile(question.type)
  if (operatorProfile === 'number') {
    return detectComparableConflict(conditions, parseNumber, '数值')
  }
  if (operatorProfile === 'date') {
    return detectComparableConflict(conditions, parseDate, '日期')
  }

  const eqValues = Array.from(
    new Set(
      conditions
        .filter((condition) => condition.operator === 'eq')
        .map((condition) => String(condition.value ?? ''))
    )
  )
  if (eqValues.length > 1) {
    return '同一题目不能同时等于多个不同值'
  }

  const containsValues = new Set(
    conditions
      .filter((condition) => condition.operator === 'contains')
      .map((condition) => String(condition.value ?? ''))
  )
  const notContainsValues = new Set(
    conditions
      .filter((condition) => condition.operator === 'not_contains')
      .map((condition) => String(condition.value ?? ''))
  )
  for (const value of containsValues) {
    if (notContainsValues.has(value)) {
      return '“包含”和“不包含”不能同时指向同一项'
    }
  }

  if (eqValues.length === 1) {
    const eqValue = eqValues[0]
    if (
      conditions.some(
        (condition) =>
          condition.operator === 'neq' &&
          String(condition.value ?? '') === eqValue
      )
    ) {
      return '“等于”和“不等于”不能指向同一值'
    }
  }

  return null
}

function parseNumber(value: SegmentCondition['value']): number {
  if (value === undefined || value === '') return Number.NaN
  return Number(value)
}

function parseDate(value: SegmentCondition['value']): number {
  if (value === undefined || value === '') return Number.NaN
  return Date.parse(String(value))
}

function detectComparableConflict(
  conditions: SegmentCondition[],
  parseValue: (value: SegmentCondition['value']) => number,
  subject: '数值' | '日期'
): string | null {
  let lower = -Infinity
  let lowerInclusive = true
  let upper = Infinity
  let upperInclusive = true
  const excludedValues = new Set<number>()
  const exactValues = new Set<number>()

  for (const condition of conditions) {
    const value = parseValue(condition.value)
    const value2 = parseValue(condition.value2)

    switch (condition.operator) {
      case 'eq':
        if (Number.isFinite(value)) exactValues.add(value)
        break
      case 'neq':
        if (Number.isFinite(value)) excludedValues.add(value)
        break
      case 'gt':
        if (Number.isFinite(value) && value >= lower) {
          lower = value
          lowerInclusive = false
        }
        break
      case 'gte':
        if (Number.isFinite(value) && value >= lower) {
          lower = value
          lowerInclusive = true
        }
        break
      case 'lt':
        if (Number.isFinite(value) && value <= upper) {
          upper = value
          upperInclusive = false
        }
        break
      case 'lte':
        if (Number.isFinite(value) && value <= upper) {
          upper = value
          upperInclusive = true
        }
        break
      case 'between':
        if (Number.isFinite(value) && Number.isFinite(value2)) {
          if (value >= lower) {
            lower = value
            lowerInclusive = true
          }
          if (value2 <= upper) {
            upper = value2
            upperInclusive = true
          }
        }
        break
      default:
        break
    }
  }

  if (exactValues.size > 1) {
    return '同一题目不能同时等于多个不同值'
  }

  if (lower > upper) {
    return `${subject}条件互相冲突`
  }
  if (lower === upper && (!lowerInclusive || !upperInclusive)) {
    return `${subject}区间没有可行值`
  }

  const exactValue = exactValues.values().next().value as number | undefined
  if (exactValue !== undefined) {
    const belowLower =
      exactValue < lower || (exactValue === lower && !lowerInclusive)
    const aboveUpper =
      exactValue > upper || (exactValue === upper && !upperInclusive)
    if (belowLower || aboveUpper) {
      return `等于条件与${subject}范围冲突`
    }
    if (excludedValues.has(exactValue)) {
      return '“等于”和“不等于”不能指向同一值'
    }
  }

  return null
}
