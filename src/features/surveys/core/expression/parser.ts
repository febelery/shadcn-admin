import { findReachableQuestionIds } from '../logic/flow-graph'
import { extractQuestionRefsFromWhen } from '../logic/condition-serializer'
import { canUseQuestionAsRuleSource } from '../logic/rule-capabilities'
import type { SurveySchema } from '../types'
import { flattenQuestions } from '../schema-defaults'

const REF_RE = /\{([a-zA-Z_][\w.]*)\}/g

function extractExpressionRefs(expr: string): string[] {
  const refs: string[] = []
  let m: RegExpExecArray | null
  REF_RE.lastIndex = 0
  while ((m = REF_RE.exec(expr)) !== null) {
    refs.push(m[1])
  }
  return refs
}

function validateExpressionSyntax(expr: string): string | null {
  if (!expr.trim()) return '条件表达式不能为空'
  const open = (expr.match(/\(/g) || []).length
  const close = (expr.match(/\)/g) || []).length
  if (open !== close) return '括号不匹配'
  return null
}

export interface StaticIssue {
  code: string
  message: string
  targetId?: string
  ruleId?: string
  severity: 'error' | 'warn'
}

function questionOrderIndex(questions: { id: string }[], id: string): number {
  return questions.findIndex((q) => q.id === id)
}

export function analyseSurvey(schema: SurveySchema): StaticIssue[] {
  const issues: StaticIssue[] = []
  const questions = flattenQuestions(schema)
  const questionById = new Map(questions.map((q) => [q.id, q]))
  const qIds = new Set(questions.map((q) => q.id))
  const sectionIds = new Set(schema.sections.map((s) => s.id))
  const requiredIds = new Set(questions.filter((q) => q.required).map((q) => q.id))

  const showTargets = new Map<string, string[]>()
  const hideTargets = new Map<string, string[]>()
  const navigationBySourceAndWhen = new Map<
    string,
    { ruleId: string; target: string; name: string }[]
  >()

  for (const rule of schema.rules) {
    if (!rule.enabled) continue
    const syntax = validateExpressionSyntax(rule.when)
    if (syntax) {
      issues.push({
        code: 'expr_syntax',
        message: `规则「${rule.name}」：${syntax}`,
        ruleId: rule.id,
        severity: 'error',
      })
    }

    const sourceQIds = extractQuestionRefsFromWhen(rule.when)
    for (const sourceId of sourceQIds) {
      const source = questionById.get(sourceId)
      if (source && !canUseQuestionAsRuleSource(source)) {
        issues.push({
          code: 'unsupported_rule_source',
          message: `规则「${rule.name}」使用了不支持作为条件的题型`,
          targetId: sourceId,
          ruleId: rule.id,
          severity: 'error',
        })
      }
    }

    for (const ref of extractExpressionRefs(rule.when)) {
      const [kind, id] = ref.split('.')
      if (kind === 'q' && id && !qIds.has(id)) {
        issues.push({
          code: 'expr_ref',
          message: `规则「${rule.name}」引用了不存在的题目 {${ref}}`,
          targetId: id,
          ruleId: rule.id,
          severity: 'error',
        })
      }
    }

    for (const action of rule.actions) {
      const target = action.target

      if (action.type === 'hide' && target && requiredIds.has(target)) {
        issues.push({
          code: 'hide_required',
          message: `规则「${rule.name}」隐藏了必填题`,
          targetId: target,
          ruleId: rule.id,
          severity: 'error',
        })
      }

      if (action.type === 'jump_to_section' && target && !sectionIds.has(target)) {
        issues.push({
          code: 'jump_target',
          message: `规则「${rule.name}」跳转目标节不存在`,
          targetId: target,
          ruleId: rule.id,
          severity: 'error',
        })
      }

      if (action.type === 'jump_to_question') {
        if (!target || !qIds.has(target)) {
          issues.push({
            code: 'jump_question_target',
            message: `规则「${rule.name}」跳转目标题目不存在`,
            targetId: target,
            ruleId: rule.id,
            severity: 'error',
          })
        } else if (sourceQIds.length > 0) {
          const srcIdx = questionOrderIndex(questions, sourceQIds[0])
          const tgtIdx = questionOrderIndex(questions, target)
          if (srcIdx >= 0 && tgtIdx >= 0 && srcIdx >= tgtIdx) {
            issues.push({
              code: 'order_violation',
              message: `规则「${rule.name}」不能跳转到条件题之前或同一题`,
              targetId: target,
              ruleId: rule.id,
              severity: 'error',
            })
          }
        }
      }

      if (action.type === 'jump_to_question' || action.type === 'end') {
        const sourceKey = sourceQIds[0] ?? '__unknown__'
        const targetKey =
          action.type === 'end' ? '__end__' : (action.target ?? '__missing__')
        const key = `${sourceKey}\n${rule.when.trim()}`
        const list = navigationBySourceAndWhen.get(key) ?? []
        list.push({ ruleId: rule.id, target: targetKey, name: rule.name })
        navigationBySourceAndWhen.set(key, list)
      }

      if (
        (action.type === 'show' || action.type === 'hide') &&
        target &&
        sourceQIds.length > 0
      ) {
        const srcIdx = questionOrderIndex(questions, sourceQIds[0])
        const tgtIdx = questionOrderIndex(questions, target)
        if (srcIdx >= 0 && tgtIdx >= 0 && srcIdx >= tgtIdx) {
          issues.push({
            code: 'order_violation',
            message: `规则「${rule.name}」条件题必须在目标题之前`,
            targetId: target,
            ruleId: rule.id,
            severity: 'error',
          })
        }
        if (action.type === 'show' && target) {
          const list = showTargets.get(target) ?? []
          list.push(rule.id)
          showTargets.set(target, list)
        }
        if (action.type === 'hide' && target) {
          const list = hideTargets.get(target) ?? []
          list.push(rule.id)
          hideTargets.set(target, list)
        }
      }
    }

    if (rule.actions.length === 0) {
      issues.push({
        code: 'no_actions',
        message: `规则「${rule.name}」未配置动作`,
        ruleId: rule.id,
        severity: 'error',
      })
    }
  }

  for (const qId of qIds) {
    if (showTargets.has(qId) && hideTargets.has(qId)) {
      issues.push({
        code: 'visibility_conflict',
        message: `题目「${questions.find((q) => q.id === qId)?.title ?? qId}」同时存在显示与隐藏规则，请检查优先级`,
        targetId: qId,
        severity: 'warn',
      })
    }
  }

  for (const list of navigationBySourceAndWhen.values()) {
    const targets = new Set(list.map((i) => i.target))
    if (list.length > 1 && targets.size > 1) {
      for (const item of list) {
        issues.push({
          code: 'navigation_conflict',
          message: `规则「${item.name}」与其他跳题/结束规则使用相同条件但目标不同，请合并或调整优先级`,
          ruleId: item.ruleId,
          severity: 'warn',
        })
      }
    }
  }

  const reachable = findReachableQuestionIds(schema)
  for (const q of questions) {
    if (!reachable.has(q.id) && schema.rules.some((r) => r.enabled)) {
      issues.push({
        code: 'unreachable_question',
        message: `题目「${q.title || q.id}」可能不可达（无默认路径到达）`,
        targetId: q.id,
        severity: 'warn',
      })
    }
  }

  return issues
}

/** 发布阻断：仅 error 级别 */
export function hasBlockingIssues(schema: SurveySchema): boolean {
  return analyseSurvey(schema).some((i) => i.severity === 'error')
}
