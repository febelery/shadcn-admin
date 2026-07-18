import type { SurveyDocument, SurveyElement } from './types'

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

function collectElementEntries(
  elements: SurveyElement[],
  path: (string | number)[]
): { id: string; path: (string | number)[] }[] {
  const entries: { id: string; path: (string | number)[] }[] = []
  elements.forEach((element, index) => {
    const elementPath = [...path, index, 'id']
    entries.push({ id: element.id, path: elementPath })
    if (element.kind === 'panel') {
      entries.push(
        ...collectElementEntries(element.elements, [...path, index, 'elements'])
      )
    }
    if (element.kind === 'question' && element.type === 'dynamic_panel') {
      entries.push(
        ...collectElementEntries(element.config.templateElements, [
          ...path,
          index,
          'config',
          'templateElements',
        ])
      )
    }
  })
  return entries
}

export function getDocumentIdentityIssues(
  document: SurveyDocument
): DocumentIdentityIssue[] {
  const sectionEntries = document.sections.map((section, index) => ({
    id: section.id,
    path: ['sections', index, 'id'] as (string | number)[],
  }))
  const elementEntries = document.sections.flatMap((section, sectionIndex) =>
    collectElementEntries(section.elements, [
      'sections',
      sectionIndex,
      'elements',
    ])
  )
  const ruleEntries = document.rules.map((rule, index) => ({
    id: rule.id,
    path: ['rules', index, 'id'] as (string | number)[],
  }))
  const actionEntries = document.rules.map((rule, index) => ({
    id: rule.action.id,
    path: ['rules', index, 'action', 'id'] as (string | number)[],
  }))
  const variableEntries = document.variables.map((variable, index) => ({
    id: variable.id,
    path: ['variables', index, 'id'] as (string | number)[],
  }))
  const validatorEntries = document.validators.map((validator, index) => ({
    id: validator.id,
    path: ['validators', index, 'id'] as (string | number)[],
  }))

  return [
    ...collectDuplicateIdIssues(sectionEntries, 'section ID 必须唯一'),
    ...collectDuplicateIdIssues(elementEntries, 'element ID 必须唯一'),
    ...collectDuplicateIdIssues(ruleEntries, 'rule ID 必须唯一'),
    ...collectDuplicateIdIssues(actionEntries, 'action ID 必须唯一'),
    ...collectDuplicateIdIssues(variableEntries, 'variable ID 必须唯一'),
    ...collectDuplicateIdIssues(validatorEntries, 'validator ID 必须唯一'),
  ]
}
