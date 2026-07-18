import type { Rule, RuleAction, RuleActionType } from '../types'

export function createRuleId() {
  return crypto.randomUUID()
}

export function createActionId() {
  return crypto.randomUUID()
}

export function createEmptyRule(priority = 0): Rule {
  return {
    id: createRuleId(),
    name: '新规则',
    enabled: true,
    priority,
    condition: { questionId: '', operator: 'not_empty' },
    action: createRuleAction('show'),
  }
}

export function createRuleAction(
  type: RuleActionType,
  target?: string
): RuleAction {
  return { id: createActionId(), type, target }
}

const QUESTION_TARGET_ACTION_TYPES: ReadonlySet<RuleActionType> = new Set([
  'show',
  'hide',
  'jump_to_question',
])

/** 规则是否以某题为条件来源 */
export function ruleReferencesQuestionAsSource(
  rule: Rule,
  questionId: string
): boolean {
  return rule.condition.questionId === questionId
}

/** 规则是否以某题为动作目标 */
export function ruleTargetsQuestion(rule: Rule, questionId: string): boolean {
  return (
    rule.action.target === questionId &&
    QUESTION_TARGET_ACTION_TYPES.has(rule.action.type)
  )
}

export function ruleActionTargetsQuestion(type: RuleActionType): boolean {
  return QUESTION_TARGET_ACTION_TYPES.has(type)
}

export function ruleReferencesQuestion(
  rule: Rule,
  questionId: string
): boolean {
  return (
    ruleReferencesQuestionAsSource(rule, questionId) ||
    ruleTargetsQuestion(rule, questionId)
  )
}

export function ruleReferencesAnyQuestion(
  rule: Rule,
  questionIds: ReadonlySet<string>
): boolean {
  return [...questionIds].some((id) => ruleReferencesQuestion(rule, id))
}

export function normalizeRulePriorities(rules: Rule[]): Rule[] {
  return rules.map((rule, priority) => ({ ...rule, priority }))
}

export function removeRulesReferencingQuestions(
  rules: Rule[],
  questionIds: Iterable<string>
): Rule[] {
  const ids = new Set(questionIds)
  if (ids.size === 0) return rules
  return normalizeRulePriorities(
    rules.filter((rule) => !ruleReferencesAnyQuestion(rule, ids))
  )
}

/** 与某题相关的规则（条件来源或动作目标） */
export function getRulesForQuestion(rules: Rule[], questionId: string): Rule[] {
  return rules.filter(
    (r) =>
      ruleReferencesQuestionAsSource(r, questionId) ||
      ruleTargetsQuestion(r, questionId)
  )
}

export function summarizeRuleAction(
  action: RuleAction,
  questionTitle?: string
): string {
  switch (action.type) {
    case 'show':
      return `显示 ${questionTitle ?? action.target ?? ''}`
    case 'hide':
      return `隐藏 ${questionTitle ?? action.target ?? ''}`
    case 'jump_to_question':
      return `跳转到 ${questionTitle ?? action.target ?? ''}`
    case 'end':
      return '结束问卷'
    default:
      return action.type
  }
}
