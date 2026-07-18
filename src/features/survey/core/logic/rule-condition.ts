import type { RuleCondition } from '../types'

export function areRuleConditionsEqual(
  left: RuleCondition,
  right: RuleCondition
): boolean {
  if (
    left.questionId !== right.questionId ||
    left.operator !== right.operator
  ) {
    return false
  }
  const leftValue = 'value' in left ? left.value : undefined
  const rightValue = 'value' in right ? right.value : undefined
  return leftValue === rightValue
}

export function getRuleConditionValue(
  condition: RuleCondition
): string | number | undefined {
  return 'value' in condition ? condition.value : undefined
}

export function getRuleConditionKey(condition: RuleCondition): string {
  return JSON.stringify([
    condition.questionId,
    condition.operator,
    getRuleConditionValue(condition),
  ])
}
