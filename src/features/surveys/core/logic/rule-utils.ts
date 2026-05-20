import { createQuestionId } from '../schema-defaults'
import type { Rule, RuleAction, RuleActionType } from '../types'
import { extractQuestionRefsFromWhen } from './condition-serializer'

export function createRuleId() {
  return createQuestionId()
}

export function createActionId() {
  return createQuestionId()
}

export function createEmptyRule(priority = 0): Rule {
  return {
    id: createRuleId(),
    name: '新规则',
    enabled: true,
    priority,
    when: '',
    actions: [],
  }
}

export function createRuleAction(
  type: RuleActionType,
  target?: string
): RuleAction {
  return { id: createActionId(), type, target }
}

/** 规则是否以某题为条件来源 */
export function ruleReferencesQuestionAsSource(rule: Rule, questionId: string): boolean {
  return extractQuestionRefsFromWhen(rule.when).includes(questionId)
}

/** 规则是否以某题为动作目标 */
export function ruleTargetsQuestion(rule: Rule, questionId: string): boolean {
  return rule.actions.some(
    (a) =>
      a.target === questionId &&
      (a.type === 'show' ||
        a.type === 'hide' ||
        a.type === 'jump_to_question' ||
        a.type === 'set_required' ||
        a.type === 'set_value')
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

export function summarizeRuleAction(action: RuleAction, questionTitle?: string): string {
  switch (action.type) {
    case 'show':
      return `显示 ${questionTitle ?? action.target ?? ''}`
    case 'hide':
      return `隐藏 ${questionTitle ?? action.target ?? ''}`
    case 'jump_to_question':
      return `跳转到 ${questionTitle ?? action.target ?? ''}`
    case 'jump_to_section':
      return `跳转到节 ${action.target ?? ''}`
    case 'end':
      return '结束问卷'
    case 'set_required':
      return `设为必填 ${action.target ?? ''}`
    case 'set_value':
      return `赋值 ${action.target ?? ''}`
    default:
      return action.type
  }
}
