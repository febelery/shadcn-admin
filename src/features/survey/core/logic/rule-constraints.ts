import type {
  QuestionElement,
  Rule,
  RuleAction,
  RuleActionType,
  RuleCondition,
} from '../types'
import { RULE_ACTION_TYPES } from '../types'
import { canUseQuestionAsRuleSource } from './rule-capabilities'
import { areRuleConditionsEqual } from './rule-condition'

export type NavigationTargetLock =
  { type: 'end' } | { type: 'question'; target: string }

export function getRuleSourceQuestionIds(
  questions: QuestionElement[]
): string[] {
  return questions.filter(canUseQuestionAsRuleSource).map((q) => q.id)
}

export function resolveRuleSourceId(
  condition: RuleCondition,
  allowedSourceIds: readonly string[],
  fallbackSourceId?: string
): string | undefined {
  if (allowedSourceIds.includes(condition.questionId)) {
    return condition.questionId
  }
  if (fallbackSourceId && allowedSourceIds.includes(fallbackSourceId)) {
    return fallbackSourceId
  }
  return allowedSourceIds[0]
}

export function getQuestionIdsAfter(
  questions: QuestionElement[],
  sourceId?: string
): string[] {
  if (!sourceId) return []
  const sourceIndex = questions.findIndex((q) => q.id === sourceId)
  return sourceIndex >= 0
    ? questions.slice(sourceIndex + 1).map((q) => q.id)
    : []
}

export function getNavigationTargetLock(
  rules: Rule[],
  currentRuleId: string,
  condition: RuleCondition
): NavigationTargetLock | null {
  const source = condition.questionId
  if (!source) return null

  const targetKeys = new Set<string>()
  for (const rule of rules) {
    if (rule.id === currentRuleId || !rule.enabled) continue
    if (!areRuleConditionsEqual(rule.condition, condition)) continue

    const nav = rule.action
    if (nav.type !== 'jump_to_question' && nav.type !== 'end') continue
    targetKeys.add(nav.type === 'end' ? '__end__' : (nav.target ?? ''))
  }

  if (targetKeys.size !== 1) return null
  const [target] = [...targetKeys]
  return target === '__end__' ? { type: 'end' } : { type: 'question', target }
}

export function getRuleTargetQuestionIds({
  type,
  sourceId,
  questions,
  rules = [],
  currentRuleId = '',
  condition,
}: {
  type: RuleActionType
  sourceId?: string
  questions: QuestionElement[]
  rules?: Rule[]
  currentRuleId?: string
  condition: RuleCondition
}): string[] {
  const laterIds = getQuestionIdsAfter(questions, sourceId)

  if (type === 'show' || type === 'hide') return laterIds
  if (type === 'jump_to_question') {
    const lock = getNavigationTargetLock(rules, currentRuleId, condition)
    if (lock?.type === 'end') return []
    if (lock?.type === 'question') {
      return laterIds.includes(lock.target) ? [lock.target] : []
    }
    return laterIds
  }
  return []
}

export function canUseRuleActionType({
  type,
  sourceId,
  questions,
  rules,
  currentRuleId,
  condition,
}: {
  type: RuleActionType
  sourceId?: string
  questions: QuestionElement[]
  rules?: Rule[]
  currentRuleId?: string
  condition: RuleCondition
}): boolean {
  if (!sourceId) return false
  if (type === 'end') {
    return (
      getNavigationTargetLock(rules ?? [], currentRuleId ?? '', condition)
        ?.type !== 'question'
    )
  }
  return (
    getRuleTargetQuestionIds({
      type,
      sourceId,
      questions,
      rules,
      currentRuleId,
      condition,
    }).length > 0
  )
}

export function getAvailableRuleActionTypes({
  requestedTypes = RULE_ACTION_TYPES,
  sourceId,
  questions,
  rules,
  currentRuleId,
  condition,
}: {
  requestedTypes?: readonly RuleActionType[]
  sourceId?: string
  questions: QuestionElement[]
  rules?: Rule[]
  currentRuleId?: string
  condition: RuleCondition
}): RuleActionType[] {
  return requestedTypes.filter((type) =>
    canUseRuleActionType({
      type,
      sourceId,
      questions,
      rules,
      currentRuleId,
      condition,
    })
  )
}

export function normalizeRuleAction({
  action,
  requestedType,
  requestedTarget,
  fallbackTypes = RULE_ACTION_TYPES,
  sourceId,
  questions,
  rules,
  currentRuleId,
  condition,
}: {
  action: RuleAction
  requestedType: RuleActionType
  requestedTarget?: string
  fallbackTypes?: readonly RuleActionType[]
  sourceId?: string
  questions: QuestionElement[]
  rules?: Rule[]
  currentRuleId?: string
  condition: RuleCondition
}): RuleAction {
  const available = getAvailableRuleActionTypes({
    requestedTypes: fallbackTypes,
    sourceId,
    questions,
    rules,
    currentRuleId,
    condition,
  })
  const type = available.includes(requestedType)
    ? requestedType
    : (available[0] ?? 'end')
  const targetIds = getRuleTargetQuestionIds({
    type,
    sourceId,
    questions,
    rules,
    currentRuleId,
    condition,
  })
  const target =
    type === 'end'
      ? undefined
      : requestedTarget && targetIds.includes(requestedTarget)
        ? requestedTarget
        : targetIds[0]

  return { ...action, type, target }
}

export function getAutoRuleName(
  type: RuleActionType,
  targetLabel?: string
): string {
  switch (type) {
    case 'show':
      return `显示 ${targetLabel ?? '题目'}`
    case 'hide':
      return `隐藏 ${targetLabel ?? '题目'}`
    case 'jump_to_question':
      return `跳转到 ${targetLabel ?? '题目'}`
    case 'end':
      return '结束问卷'
    default:
      return '逻辑规则'
  }
}
