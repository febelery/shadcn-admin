import type {
  SegmentCondition,
  SegmentConditionOperator,
  SegmentDefinition,
} from '@/features/survey/core/analysis-schema'
import {
  getConditionOperatorDefinition,
  getSegmentOperatorsForQuestionType,
} from '@/features/survey/core/logic/operators'
import { questionUsesOptions } from '@/features/survey/core/question-config'
import { getQuestionNumberPrefix } from '@/features/survey/core/question-numbering'
import type {
  QuestionElement,
  SurveyDocument,
} from '@/features/survey/core/types'

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
    (operator) => operator.value
  )
}

export function operatorNeedsValue(
  operator: SegmentConditionOperator
): boolean {
  return getConditionOperatorDefinition(operator).needsValue
}

export function operatorNeedsSecondValue(
  operator: SegmentConditionOperator
): boolean {
  return Boolean(getConditionOperatorDefinition(operator).needsSecondValue)
}

export function isSupportedQuestion(question: QuestionElement): boolean {
  return getSegmentOperatorsForQuestionType(question.type).length > 0
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
    return getConditionOperatorDefinition(condition.operator).label

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
  question: QuestionElement | undefined,
  document: SurveyDocument,
  questions: QuestionElement[]
): string {
  if (!condition.questionId || !question) return '未选择题目'
  const label = getQuestionLabel(question, document, questions)
  const operator = getConditionOperatorDefinition(condition.operator).label
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
    return getConditionText(condition, question, document, questions)
  })
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%'
  return `${(value * 100).toFixed(value >= 0.1 ? 0 : 1)}%`
}
