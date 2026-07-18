import type {
  SegmentCondition,
  SegmentConditionOperator,
  SegmentDefinition,
} from '@/features/survey/core/analysis-types'
import { getSegmentOperatorsForQuestionType } from '@/features/survey/core/logic/operators'
import { questionUsesOptions } from '@/features/survey/core/question-config'
import { getQuestionNumberPrefix } from '@/features/survey/core/question-numbering'
import type {
  QuestionElement,
  SurveyDocument,
} from '@/features/survey/core/types'

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
  return crypto.randomUUID()
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

export function getOperators(
  question: QuestionElement
): SegmentConditionOperator[] {
  return getSegmentOperatorsForQuestionType(question.type).map(
    (o) => o.value as SegmentConditionOperator
  )
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

export function isSupportedQuestion(question: QuestionElement): boolean {
  return SUPPORTED_TYPES.has(question.type)
}

export function getQuestionLabel(
  question: QuestionElement,
  document: SurveyDocument,
  questions: QuestionElement[]
): string {
  const idx = questions.indexOf(question) + 1
  const prefix = getQuestionNumberPrefix(question, document)
  if (prefix) {
    return `${prefix.trim()} ${question.title || '未命名'}`
  }
  return `Q${idx}. ${question.title || '未命名'}`
}

export function getDefaultOperator(
  question: QuestionElement
): SegmentConditionOperator {
  return getOperators(question)[0] ?? 'eq'
}

export function getDefaultValue(
  question: QuestionElement,
  operator: SegmentConditionOperator
): string | undefined {
  if (!operatorNeedsValue(operator)) return undefined
  if (questionUsesOptions(question.type)) {
    return question.config?.options?.[0]?.id ?? ''
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
  questionMap: Map<string, QuestionElement>
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
  question: QuestionElement
): string {
  if (!condition.questionId || !question) return '请选择题目'
  if (!operatorNeedsValue(condition.operator))
    return OPERATOR_LABELS[condition.operator]

  const value = String(condition.value ?? '')
  if (condition.operator === 'between') {
    return `${value} 到 ${String(condition.value2 ?? '')}`
  }
  if (questionUsesOptions(question.type)) {
    const label =
      question.config.options?.find((option) => option.id === value)?.label ??
      value
    return label || '请选择答案'
  }
  return value || '请输入值'
}

export function getConditionText(
  condition: SegmentCondition,
  question: QuestionElement,
  document: SurveyDocument,
  questions: QuestionElement[]
): string {
  if (!condition.questionId || !question) return '未选择题目'
  const label = getQuestionLabel(question, document, questions)
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
  questionMap: Map<string, QuestionElement>,
  document: SurveyDocument,
  questions: QuestionElement[]
): string[] {
  return segment.conditions.map((condition) => {
    const question = questionMap.get(condition.questionId)
    return getConditionText(condition, question!, document, questions)
  })
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%'
  return `${(value * 100).toFixed(value >= 0.1 ? 0 : 1)}%`
}
