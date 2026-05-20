import type { SurveySchema } from '../types'
import { flattenQuestions } from '../schema-defaults'

const REF_RE = /\{([a-zA-Z_][\w.]*)\}/g

export function extractExpressionRefs(expr: string): string[] {
  const refs: string[] = []
  let m: RegExpExecArray | null
  while ((m = REF_RE.exec(expr)) !== null) {
    refs.push(m[1])
  }
  return refs
}

export function validateExpressionSyntax(expr: string): string | null {
  if (!expr.trim()) return 'Expression is empty'
  const open = (expr.match(/\(/g) || []).length
  const close = (expr.match(/\)/g) || []).length
  if (open !== close) return 'Unbalanced parentheses'
  return null
}

export interface StaticIssue {
  code: string
  message: string
  targetId?: string
}

export function analyseSurvey(schema: SurveySchema): StaticIssue[] {
  const issues: StaticIssue[] = []
  const questions = flattenQuestions(schema)
  const qIds = new Set(questions.map((q) => q.id))
  const sectionIds = new Set(schema.sections.map((s) => s.id))
  const requiredIds = new Set(questions.filter((q) => q.required).map((q) => q.id))

  for (const rule of schema.rules) {
    if (!rule.enabled) continue
    const syntax = validateExpressionSyntax(rule.when)
    if (syntax) {
      issues.push({ code: 'expr_syntax', message: `${rule.name}: ${syntax}` })
    }
    for (const ref of extractExpressionRefs(rule.when)) {
      const [kind, id] = ref.split('.')
      if (kind === 'q' && id && !qIds.has(id)) {
        issues.push({
          code: 'expr_ref',
          message: `Unknown question ref {${ref}}`,
          targetId: id,
        })
      }
    }
    for (const action of rule.actions) {
      if (action.type === 'hide' && action.target && requiredIds.has(action.target)) {
        issues.push({
          code: 'hide_required',
          message: `Rule "${rule.name}" hides a required question`,
          targetId: action.target,
        })
      }
      if (action.type === 'jump_to_section' && action.target && !sectionIds.has(action.target)) {
        issues.push({
          code: 'jump_target',
          message: `Invalid section jump target`,
          targetId: action.target,
        })
      }
    }
  }

  return issues
}
