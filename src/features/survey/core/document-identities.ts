import type { SurveyDocument } from './types'

export interface DocumentIdentityIssue {
  path: (string | number)[]
  message: string
}

function collectDuplicateIdIssues(
  entries: { id: string; path: (string | number)[] }[],
  message: string
): DocumentIdentityIssue[] {
  const firstPathById = new Map<string, (string | number)[]>()
  const issues: DocumentIdentityIssue[] = []
  for (const entry of entries) {
    const firstPath = firstPathById.get(entry.id)
    if (firstPath) {
      issues.push({
        path: entry.path,
        message: `${message}（与 ${firstPath.join('.')} 重复）`,
      })
    } else {
      firstPathById.set(entry.id, entry.path)
    }
  }
  return issues
}

export function getDocumentIdentityIssues(
  document: SurveyDocument
): DocumentIdentityIssue[] {
  const elementEntries = document.elements.map((element, index) => ({
    id: element.id,
    path: ['elements', index, 'id'] as (string | number)[],
  }))
  const ruleEntries = document.rules.map((rule, index) => ({
    id: rule.id,
    path: ['rules', index, 'id'] as (string | number)[],
  }))
  const actionEntries = document.rules.map((rule, index) => ({
    id: rule.action.id,
    path: ['rules', index, 'action', 'id'] as (string | number)[],
  }))
  return [
    ...collectDuplicateIdIssues(elementEntries, 'element ID 必须唯一'),
    ...collectDuplicateIdIssues(ruleEntries, 'rule ID 必须唯一'),
    ...collectDuplicateIdIssues(actionEntries, 'action ID 必须唯一'),
  ]
}
