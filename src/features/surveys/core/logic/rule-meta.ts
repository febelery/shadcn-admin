import type { Rule, RuleActionType } from '../types'
import { extractQuestionRefsFromWhen } from './condition-serializer'

export type RuleCategory = 'visibility' | 'jump' | 'end' | 'other'

export function getRuleCategory(rule: Rule): RuleCategory {
  const t = rule.action.type
  if (t === 'show' || t === 'hide') return 'visibility'
  if (t === 'jump_to_question') return 'jump'
  if (t === 'end') return 'end'
  return 'other'
}

export const RULE_CATEGORY_LABEL: Record<RuleCategory, string> = {
  visibility: '显隐',
  jump: '跳题',
  end: '结束',
  other: '其他',
}

export function ruleMatchesFilter(
  rule: Rule,
  filter: RuleCategory | 'all'
): boolean {
  if (filter === 'all') return true
  return getRuleCategory(rule) === filter
}

export function ruleMatchesSearch(
  rule: Rule,
  q: string,
  questionTitles: Map<string, string>
): boolean {
  if (!q.trim()) return true
  const needle = q.trim().toLowerCase()
  if (rule.name.toLowerCase().includes(needle)) return true
  if (rule.when.toLowerCase().includes(needle)) return true
  for (const ref of extractQuestionRefsFromWhen(rule.when)) {
    const title = questionTitles.get(ref)
    if (title?.toLowerCase().includes(needle)) return true
  }
  if (
    rule.action.target &&
    questionTitles.get(rule.action.target)?.toLowerCase().includes(needle)
  )
    return true
  return false
}

export function actionTypeLabel(type: RuleActionType): string {
  switch (type) {
    case 'show':
      return '显示题目'
    case 'hide':
      return '隐藏题目'
    case 'jump_to_question':
      return '跳转到题目'
    case 'end':
      return '结束问卷'
    default:
      return type
  }
}
