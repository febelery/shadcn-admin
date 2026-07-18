import { getQuestionDefinition } from '../question-definitions'
import { flattenQuestions } from '../schema-defaults'
import type { QuestionElement, RuleCondition, SurveySchema } from '../types'
import { getRuleOperatorsForQuestionType } from './operators'
import { canUseQuestionAsRuleSource } from './rule-capabilities'
import { getRuleConditionKey } from './rule-condition'
import { ruleActionTargetsQuestion } from './rule-utils'

export interface StaticIssue {
  code: string
  message: string
  targetId?: string
  ruleId?: string
  severity: 'error' | 'warn'
}

function questionOrderIndex(questions: { id: string }[], id: string): number {
  return questions.findIndex((question) => question.id === id)
}

function conditionValueIssue(
  question: QuestionElement,
  condition: RuleCondition
): string | null {
  if (!('value' in condition)) return null
  if (condition.value === '') return '比较值不能为空'

  const profile = getQuestionDefinition(question.type).operatorProfile
  if (profile === 'choice' || profile === 'multi') {
    const optionExists = question.config.options?.some(
      (option) => option.id === condition.value
    )
    return optionExists ? null : '条件引用了不存在的选项'
  }
  if (profile === 'number' && !Number.isFinite(Number(condition.value))) {
    return '比较值必须是有效数字'
  }
  if (profile === 'date' && Number.isNaN(Date.parse(String(condition.value)))) {
    return '比较值必须是有效日期'
  }
  return null
}

export function analyseSurvey(document: SurveySchema): StaticIssue[] {
  const issues: StaticIssue[] = []
  const questions = flattenQuestions(document)
  const questionById = new Map(
    questions.map((question) => [question.id, question])
  )
  const questionIds = new Set(questionById.keys())
  const showTargets = new Map<string, string[]>()
  const hideTargets = new Map<string, string[]>()
  const navigationByCondition = new Map<
    string,
    { ruleId: string; target: string; name: string }[]
  >()

  for (const rule of document.rules) {
    if (!rule.enabled) continue

    const sourceId = rule.condition.questionId
    const source = questionById.get(sourceId)
    if (!source) {
      issues.push({
        code: 'condition_question',
        message: `规则「${rule.name}」引用了不存在的条件题目`,
        targetId: sourceId,
        ruleId: rule.id,
        severity: 'error',
      })
    } else if (!canUseQuestionAsRuleSource(source)) {
      issues.push({
        code: 'unsupported_rule_source',
        message: `规则「${rule.name}」使用了不支持作为条件的题型`,
        targetId: sourceId,
        ruleId: rule.id,
        severity: 'error',
      })
    } else {
      const operatorAllowed = getRuleOperatorsForQuestionType(source.type).some(
        (operator) => operator.value === rule.condition.operator
      )
      if (!operatorAllowed) {
        issues.push({
          code: 'condition_operator',
          message: `规则「${rule.name}」的运算符不适用于条件题型`,
          targetId: sourceId,
          ruleId: rule.id,
          severity: 'error',
        })
      }

      const valueIssue = conditionValueIssue(source, rule.condition)
      if (valueIssue) {
        issues.push({
          code: 'condition_value',
          message: `规则「${rule.name}」：${valueIssue}`,
          targetId: sourceId,
          ruleId: rule.id,
          severity: 'error',
        })
      }
    }

    const action = rule.action
    const target = action.target
    if (ruleActionTargetsQuestion(action.type)) {
      if (!target || !questionIds.has(target)) {
        issues.push({
          code: 'action_target',
          message: `规则「${rule.name}」动作目标题目不存在`,
          targetId: target,
          ruleId: rule.id,
          severity: 'error',
        })
      } else {
        const sourceIndex = questionOrderIndex(questions, sourceId)
        const targetIndex = questionOrderIndex(questions, target)
        if (
          sourceIndex >= 0 &&
          targetIndex >= 0 &&
          sourceIndex >= targetIndex
        ) {
          issues.push({
            code: 'order_violation',
            message:
              action.type === 'jump_to_question'
                ? `规则「${rule.name}」不能跳转到条件题之前或同一题`
                : `规则「${rule.name}」条件题必须在目标题之前`,
            targetId: target,
            ruleId: rule.id,
            severity: 'error',
          })
        }
      }
    }

    if (action.type === 'jump_to_question' || action.type === 'end') {
      const targetKey =
        action.type === 'end' ? '__end__' : (action.target ?? '__missing__')
      const conditionKey = getRuleConditionKey(rule.condition)
      const list = navigationByCondition.get(conditionKey) ?? []
      list.push({ ruleId: rule.id, target: targetKey, name: rule.name })
      navigationByCondition.set(conditionKey, list)
    }

    if ((action.type === 'show' || action.type === 'hide') && target) {
      const targetMap = action.type === 'show' ? showTargets : hideTargets
      const list = targetMap.get(target) ?? []
      list.push(rule.id)
      targetMap.set(target, list)
    }
  }

  for (const questionId of questionIds) {
    if (showTargets.has(questionId) && hideTargets.has(questionId)) {
      issues.push({
        code: 'visibility_conflict',
        message: `题目「${questionById.get(questionId)?.title ?? questionId}」同时存在显示与隐藏规则，请检查优先级`,
        targetId: questionId,
        severity: 'warn',
      })
    }
  }

  for (const list of navigationByCondition.values()) {
    const targets = new Set(list.map((item) => item.target))
    if (list.length <= 1 || targets.size <= 1) continue
    for (const item of list) {
      issues.push({
        code: 'navigation_conflict',
        message: `规则「${item.name}」与其他跳题/结束规则使用相同条件但目标不同，请合并或调整优先级`,
        ruleId: item.ruleId,
        severity: 'warn',
      })
    }
  }

  return issues
}

export function hasBlockingIssues(document: SurveySchema): boolean {
  return analyseSurvey(document).some((issue) => issue.severity === 'error')
}
