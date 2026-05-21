import type {
  QuestionElement,
  Rule,
  RuleAction,
  RuleActionType,
} from '../types'
import { extractQuestionRefsFromWhen } from './condition-serializer'
import { canUseQuestionAsRuleSource } from './rule-capabilities'

export const EDITABLE_RULE_ACTION_TYPES = [
  'show',
  'hide',
  'jump_to_question',
  'end',
] as const satisfies readonly RuleActionType[]

export type EditableRuleActionType = (typeof EDITABLE_RULE_ACTION_TYPES)[number]

export type NavigationTargetLock =
  | { type: 'end' }
  | { type: 'question'; target: string }

export function isEditableRuleActionType(
  type: RuleActionType
): type is EditableRuleActionType {
  return EDITABLE_RULE_ACTION_TYPES.includes(type as EditableRuleActionType)
}

export function getRuleSourceQuestionIds(
  questions: QuestionElement[]
): string[] {
  return questions.filter(canUseQuestionAsRuleSource).map((q) => q.id)
}

export function resolveRuleSourceId(
  when: string,
  allowedSourceIds: readonly string[],
  fallbackSourceId?: string
): string | undefined {
  const sourceFromWhen = extractQuestionRefsFromWhen(when)[0]
  if (sourceFromWhen && allowedSourceIds.includes(sourceFromWhen)) {
    return sourceFromWhen
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
  when: string
): NavigationTargetLock | null {
  const source = extractQuestionRefsFromWhen(when)[0]
  if (!source) return null

  const targetKeys = new Set<string>()
  for (const rule of rules) {
    if (rule.id === currentRuleId || !rule.enabled) continue
    if (rule.when.trim() !== when.trim()) continue
    if (extractQuestionRefsFromWhen(rule.when)[0] !== source) continue

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
  when = '',
}: {
  type: RuleActionType
  sourceId?: string
  questions: QuestionElement[]
  rules?: Rule[]
  currentRuleId?: string
  when?: string
}): string[] {
  const laterIds = getQuestionIdsAfter(questions, sourceId)

  if (type === 'show') return laterIds
  if (type === 'hide') {
    return laterIds.filter((id) => {
      const q = questions.find((item) => item.id === id)
      return q && !q.required
    })
  }
  if (type === 'jump_to_question') {
    const lock = getNavigationTargetLock(rules, currentRuleId, when)
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
  when,
}: {
  type: RuleActionType
  sourceId?: string
  questions: QuestionElement[]
  rules?: Rule[]
  currentRuleId?: string
  when?: string
}): boolean {
  if (!sourceId) return false
  if (type === 'end') {
    return (
      getNavigationTargetLock(rules ?? [], currentRuleId ?? '', when ?? '')
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
      when,
    }).length > 0
  )
}

export function getAvailableRuleActionTypes({
  requestedTypes = EDITABLE_RULE_ACTION_TYPES,
  sourceId,
  questions,
  rules,
  currentRuleId,
  when,
}: {
  requestedTypes?: readonly RuleActionType[]
  sourceId?: string
  questions: QuestionElement[]
  rules?: Rule[]
  currentRuleId?: string
  when?: string
}): EditableRuleActionType[] {
  return requestedTypes.filter(isEditableRuleActionType).filter((type) =>
    canUseRuleActionType({
      type,
      sourceId,
      questions,
      rules,
      currentRuleId,
      when,
    })
  )
}

export function normalizeRuleAction({
  action,
  requestedType,
  requestedTarget,
  fallbackTypes = EDITABLE_RULE_ACTION_TYPES,
  sourceId,
  questions,
  rules,
  currentRuleId,
  when,
}: {
  action: RuleAction
  requestedType: RuleActionType
  requestedTarget?: string
  fallbackTypes?: readonly RuleActionType[]
  sourceId?: string
  questions: QuestionElement[]
  rules?: Rule[]
  currentRuleId?: string
  when?: string
}): RuleAction {
  const available = getAvailableRuleActionTypes({
    requestedTypes: fallbackTypes,
    sourceId,
    questions,
    rules,
    currentRuleId,
    when,
  })
  const type = available.includes(requestedType as EditableRuleActionType)
    ? requestedType
    : (available[0] ?? 'end')
  const targetIds = getRuleTargetQuestionIds({
    type,
    sourceId,
    questions,
    rules,
    currentRuleId,
    when,
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
