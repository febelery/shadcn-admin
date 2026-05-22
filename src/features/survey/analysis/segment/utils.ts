import type {
  SegmentCondition,
  SegmentConditionOperator,
  SegmentDefinition,
} from '@/features/survey/core/analysis-types'
import { getQuestionNumberPrefix } from '@/features/survey/shared/question-numbering'

export type FieldKind = 'choice' | 'multi' | 'number' | 'text'

export const SUPPORTED_TYPES = new Set([
  'single_choice',
  'dropdown',
  'multiple_choice',
  'rating',
  'nps',
  'number',
  'slider',
  'text',
  'textarea',
  'email',
  'phone',
])

export const OPERATOR_LABELS: Record<SegmentConditionOperator, string> = {
  eq: '等于',
  neq: '不等于',
  contains: '包含',
  not_contains: '不包含',
  gt: '大于',
  gte: '大于等于',
  lt: '小于',
  lte: '小于等于',
  between: '介于',
  empty: '为空',
  not_empty: '不为空',
}

export function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createCondition(): SegmentCondition {
  return {
    questionId: '',
    operator: 'eq',
    value: '',
  }
}

export function createSegment(index: number): SegmentDefinition {
  return {
    id: createId(),
    label: `统计项 ${index}`,
    conditions: [createCondition()],
  }
}

export function getFieldKind(question: any): FieldKind {
  if (question.type === 'single_choice' || question.type === 'dropdown') {
    return 'choice'
  }
  if (question.type === 'multiple_choice') {
    return 'multi'
  }
  if (
    question.type === 'rating' ||
    question.type === 'nps' ||
    question.type === 'number' ||
    question.type === 'slider'
  ) {
    return 'number'
  }
  return 'text'
}

export function getOperators(question: any): SegmentConditionOperator[] {
  const kind = getFieldKind(question)
  if (kind === 'choice') {
    return ['eq', 'neq', 'empty', 'not_empty']
  }
  if (kind === 'multi') {
    return ['contains', 'not_contains', 'empty', 'not_empty']
  }
  if (kind === 'number') {
    return [
      'eq',
      'neq',
      'gt',
      'gte',
      'lt',
      'lte',
      'between',
      'empty',
      'not_empty',
    ]
  }
  return ['contains', 'not_contains', 'eq', 'neq', 'empty', 'not_empty']
}

export function operatorNeedsValue(
  operator: SegmentConditionOperator
): boolean {
  return operator !== 'empty' && operator !== 'not_empty'
}

export function operatorNeedsSecondValue(
  operator: SegmentConditionOperator
): boolean {
  return operator === 'between'
}

export function isSupportedQuestion(question: any): boolean {
  return SUPPORTED_TYPES.has(question.type)
}

export function getQuestionLabel(
  question: any,
  schema: any,
  questions: any[]
): string {
  const idx = questions.indexOf(question) + 1
  const prefix = getQuestionNumberPrefix(question, schema)
  if (prefix) {
    return `${prefix.trim()} ${question.title || '未命名'}`
  }
  return `Q${idx}. ${question.title || '未命名'}`
}

export function getDefaultOperator(question: any): SegmentConditionOperator {
  return getOperators(question)[0] ?? 'eq'
}

export function getDefaultValue(
  question: any,
  operator: SegmentConditionOperator
): string | undefined {
  if (!operatorNeedsValue(operator)) return undefined
  const kind = getFieldKind(question)
  if (kind === 'choice' || kind === 'multi') {
    return question.config?.options?.[0]?.label ?? ''
  }
  return ''
}

export function areSegmentsEqual(
  left: SegmentDefinition[],
  right: SegmentDefinition[]
): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function normalizeSegmentsForQuery(
  segments: SegmentDefinition[],
  questionMap: Map<string, any>
): SegmentDefinition[] {
  return segments
    .map((segment) => ({
      ...segment,
      label: segment.label.trim() || '未命名统计项',
      conditions: segment.conditions.filter((condition) => {
        const question = questionMap.get(condition.questionId)
        if (!question) return false
        if (!operatorNeedsValue(condition.operator)) return true
        if (condition.value === undefined || condition.value === '')
          return false
        if (
          operatorNeedsSecondValue(condition.operator) &&
          (condition.value2 === undefined || condition.value2 === '')
        ) {
          return false
        }
        return true
      }),
    }))
    .filter((segment) => segment.conditions.length > 0)
}

export function getSelectionDescription(
  condition: SegmentCondition,
  question: any
): string {
  if (!condition.questionId || !question) return '请选择题目'
  if (!operatorNeedsValue(condition.operator))
    return OPERATOR_LABELS[condition.operator]

  const kind = getFieldKind(question)
  const value = String(condition.value ?? '')
  if (condition.operator === 'between') {
    return `${value} 到 ${String(condition.value2 ?? '')}`
  }
  if (kind === 'choice' || kind === 'multi') {
    return value || '请选择答案'
  }
  return value || '请输入值'
}

export function getConditionText(
  condition: SegmentCondition,
  question: any,
  schema: any,
  questions: any[]
): string {
  if (!condition.questionId || !question) return '未选择题目'
  const label = getQuestionLabel(question, schema, questions)
  const operator = OPERATOR_LABELS[condition.operator]
  const value = getSelectionDescription(condition, question)
  if (!operatorNeedsValue(condition.operator)) return `${label} ${operator}`
  return `${label} ${operator} ${value}`
}

export function getSegmentConditionCount(
  segments: SegmentDefinition[]
): number {
  return segments.reduce(
    (total, segment) => total + segment.conditions.length,
    0
  )
}

export function getSegmentPreview(
  segment: SegmentDefinition,
  questionMap: Map<string, any>,
  schema: any,
  questions: any[]
): string[] {
  return segment.conditions.map((condition) => {
    const question = questionMap.get(condition.questionId)
    return getConditionText(condition, question, schema, questions)
  })
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%'
  return `${(value * 100).toFixed(value >= 0.1 ? 0 : 1)}%`
}
