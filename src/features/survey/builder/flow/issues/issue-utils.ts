import type { StaticIssue } from '../../../core/logic/analyzer'

/** 按规则 ID 聚合 issue */
export function groupIssuesByRule(
  issues: StaticIssue[]
): Map<string, StaticIssue[]> {
  const map = new Map<string, StaticIssue[]>()
  for (const i of issues) {
    if (!i.ruleId) continue
    const list = map.get(i.ruleId) ?? []
    list.push(i)
    map.set(i.ruleId, list)
  }
  return map
}

/** 题目级 issue（无 ruleId） */
export function getQuestionIssues(issues: StaticIssue[]): StaticIssue[] {
  return issues.filter((i) => !i.ruleId && i.targetId)
}

export function worstSeverity(list: StaticIssue[]): 'error' | 'warn' | null {
  if (list.some((i) => i.severity === 'error')) return 'error'
  if (list.some((i) => i.severity === 'warn')) return 'warn'
  return null
}

export function countBySeverity(issues: StaticIssue[]) {
  return {
    errors: issues.filter((i) => i.severity === 'error').length,
    warns: issues.filter((i) => i.severity === 'warn').length,
  }
}
