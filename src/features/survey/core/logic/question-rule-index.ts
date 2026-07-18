import type { Rule } from '../types'
import { ruleTargetsQuestion } from './rule-utils'

export interface QuestionRuleSummary {
  firstRuleId: string | null
  hasVisibility: boolean
  hasBranch: boolean
}

const EMPTY_SUMMARY: QuestionRuleSummary = {
  firstRuleId: null,
  hasVisibility: false,
  hasBranch: false,
}

const indexCache = new WeakMap<Rule[], Map<string, QuestionRuleSummary>>()

function ensureSummary(
  index: Map<string, QuestionRuleSummary>,
  questionId: string
) {
  let summary = index.get(questionId)
  if (!summary) {
    summary = { ...EMPTY_SUMMARY }
    index.set(questionId, summary)
  }
  return summary
}

/** 一次扫描规则，供题目卡片按题目读取逻辑徽章与首条关联规则。 */
function buildQuestionRuleIndex(rules: Rule[]) {
  const cached = indexCache.get(rules)
  if (cached) return cached

  const index = new Map<string, QuestionRuleSummary>()
  for (const rule of rules) {
    const sourceSummary = ensureSummary(index, rule.condition.questionId)
    sourceSummary.firstRuleId ??= rule.id
    if (rule.enabled) sourceSummary.hasBranch = true

    const targetId = rule.action.target
    if (!targetId || !ruleTargetsQuestion(rule, targetId)) continue

    const summary = ensureSummary(index, targetId)
    summary.firstRuleId ??= rule.id
    if (
      rule.enabled &&
      (rule.action.type === 'show' || rule.action.type === 'hide')
    ) {
      summary.hasVisibility = true
    }
  }

  indexCache.set(rules, index)
  return index
}

export function getQuestionRuleSummary(
  rules: Rule[],
  questionId: string
): QuestionRuleSummary {
  return buildQuestionRuleIndex(rules).get(questionId) ?? EMPTY_SUMMARY
}
