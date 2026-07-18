import { getQuestionDefinition } from '../question-definitions'
import type { QuestionType } from '../types'

export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'not_contains'
  | 'empty'
  | 'not_empty'
  | 'between'

export interface OperatorDef {
  value: ConditionOperator
  label: string
  /** 是否需要填写比较值 */
  needsValue: boolean
  /** 是否需要区间上限值 */
  needsSecondValue?: boolean
}

const CHOICE_OPS: OperatorDef[] = [
  { value: 'eq', label: '等于', needsValue: true },
  { value: 'neq', label: '不等于', needsValue: true },
  { value: 'empty', label: '为空', needsValue: false },
  { value: 'not_empty', label: '不为空', needsValue: false },
]

const MULTI_OPS: OperatorDef[] = [
  { value: 'contains', label: '包含', needsValue: true },
  { value: 'not_contains', label: '不包含', needsValue: true },
  { value: 'empty', label: '为空', needsValue: false },
  { value: 'not_empty', label: '不为空', needsValue: false },
]

const TEXT_OPS: OperatorDef[] = [
  { value: 'eq', label: '等于', needsValue: true },
  { value: 'neq', label: '不等于', needsValue: true },
  { value: 'contains', label: '包含', needsValue: true },
  { value: 'empty', label: '为空', needsValue: false },
  { value: 'not_empty', label: '不为空', needsValue: false },
]

const NUMBER_OPS: OperatorDef[] = [
  { value: 'eq', label: '等于', needsValue: true },
  { value: 'neq', label: '不等于', needsValue: true },
  { value: 'gt', label: '大于', needsValue: true },
  { value: 'gte', label: '大于等于', needsValue: true },
  { value: 'lt', label: '小于', needsValue: true },
  { value: 'lte', label: '小于等于', needsValue: true },
  { value: 'between', label: '介于', needsValue: true, needsSecondValue: true },
  { value: 'empty', label: '为空', needsValue: false },
  { value: 'not_empty', label: '不为空', needsValue: false },
]

/** 按题型返回可用条件运算符 */
export function getOperatorsForQuestionType(type: QuestionType): OperatorDef[] {
  switch (getQuestionDefinition(type).operatorProfile) {
    case 'choice':
      return CHOICE_OPS
    case 'multi':
      return MULTI_OPS
    case 'text':
      return TEXT_OPS
    case 'number':
      return NUMBER_OPS
    case 'date':
      return NUMBER_OPS.filter((o) =>
        [
          'eq',
          'neq',
          'gt',
          'gte',
          'lt',
          'lte',
          'between',
          'empty',
          'not_empty',
        ].includes(o.value)
      )
    default:
      return []
  }
}

/** 是否支持可视化条件构建（MVP 题型） */
export function supportsVisualCondition(type: QuestionType): boolean {
  return getQuestionDefinition(type).ruleSource
}

export const OPERATOR_TO_EXPR: Record<ConditionOperator, string> = {
  eq: '=',
  neq: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  contains: 'contains',
  not_contains: 'not contains',
  empty: 'empty',
  not_empty: 'notEmpty',
  between: 'between',
}
