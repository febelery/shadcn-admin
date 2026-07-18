import type {
  QuestionType,
  RuleConditionOperator,
  RulePresenceConditionOperator,
} from '../types'
import { getRuleOperatorProfile } from './rule-capabilities'

export const CONDITION_OPERATORS = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'not_contains',
  'empty',
  'not_empty',
  'between',
] as const

export type ConditionOperator = (typeof CONDITION_OPERATORS)[number]

const CONDITION_OPERATOR_SET = new Set<string>(CONDITION_OPERATORS)

export interface OperatorDef {
  value: ConditionOperator
  label: string
  /** 是否需要填写比较值 */
  needsValue: boolean
  /** 是否需要区间上限值 */
  needsSecondValue?: boolean
}

const OPERATOR_DEFINITIONS = {
  eq: { value: 'eq', label: '等于', needsValue: true },
  neq: { value: 'neq', label: '不等于', needsValue: true },
  gt: { value: 'gt', label: '大于', needsValue: true },
  gte: { value: 'gte', label: '大于等于', needsValue: true },
  lt: { value: 'lt', label: '小于', needsValue: true },
  lte: { value: 'lte', label: '小于等于', needsValue: true },
  contains: { value: 'contains', label: '包含', needsValue: true },
  not_contains: {
    value: 'not_contains',
    label: '不包含',
    needsValue: true,
  },
  empty: { value: 'empty', label: '为空', needsValue: false },
  not_empty: { value: 'not_empty', label: '不为空', needsValue: false },
  between: {
    value: 'between',
    label: '介于',
    needsValue: true,
    needsSecondValue: true,
  },
} satisfies Record<ConditionOperator, OperatorDef>

function operators(...values: ConditionOperator[]): OperatorDef[] {
  return values.map((value) => OPERATOR_DEFINITIONS[value])
}

const CHOICE_OPS = operators('eq', 'neq', 'empty', 'not_empty')
const MULTI_OPS = operators('contains', 'not_contains', 'empty', 'not_empty')
const TEXT_OPS = operators('eq', 'neq', 'contains', 'empty', 'not_empty')
const COMPARABLE_OPS = operators(
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'between',
  'empty',
  'not_empty'
)

export function getConditionOperatorDefinition(
  operator: ConditionOperator
): OperatorDef {
  return OPERATOR_DEFINITIONS[operator]
}

export function isConditionOperator(value: string): value is ConditionOperator {
  return CONDITION_OPERATOR_SET.has(value)
}

/** 按题型返回可用条件运算符 */
export function getSegmentOperatorsForQuestionType(
  type: QuestionType
): OperatorDef[] {
  switch (getRuleOperatorProfile(type)) {
    case 'choice':
      return CHOICE_OPS
    case 'multiple-choice':
      return MULTI_OPS
    case 'text':
      return TEXT_OPS
    case 'number':
    case 'date':
      return COMPARABLE_OPS
    default:
      return []
  }
}

export function getRuleOperatorsForQuestionType(
  type: QuestionType
): (OperatorDef & { value: RuleConditionOperator })[] {
  return getSegmentOperatorsForQuestionType(type).filter(
    (operator): operator is OperatorDef & { value: RuleConditionOperator } =>
      isRuleConditionOperator(operator.value)
  )
}

export function isRuleConditionOperator(
  operator: string
): operator is RuleConditionOperator {
  return isConditionOperator(operator) && operator !== 'between'
}

export function isPresenceConditionOperator(
  operator: RuleConditionOperator
): operator is RulePresenceConditionOperator {
  return operator === 'empty' || operator === 'not_empty'
}
