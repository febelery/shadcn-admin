import { describe, expect, it } from 'vitest'
import type { Rule } from '../types'
import { getQuestionRuleSummary } from './question-rule-index'

const sourceCondition = {
  questionId: 'source',
  operator: 'eq',
  value: 'yes',
} as const

const rules: Rule[] = [
  {
    id: 'disabled-source',
    name: '停用条件',
    enabled: false,
    priority: 0,
    condition: sourceCondition,
    action: { id: 'a1', type: 'end' },
  },
  {
    id: 'visibility',
    name: '显示目标',
    enabled: true,
    priority: 1,
    condition: sourceCondition,
    action: { id: 'a2', type: 'show', target: 'target' },
  },
]

describe('question rule index', () => {
  it('summarizes source and target relationships in rule order', () => {
    expect(getQuestionRuleSummary(rules, 'source')).toEqual({
      firstRuleId: 'disabled-source',
      hasVisibility: false,
      hasBranch: true,
    })
    expect(getQuestionRuleSummary(rules, 'target')).toEqual({
      firstRuleId: 'visibility',
      hasVisibility: true,
      hasBranch: false,
    })
  })

  it('returns a stable summary for unchanged rules', () => {
    expect(getQuestionRuleSummary(rules, 'source')).toBe(
      getQuestionRuleSummary(rules, 'source')
    )
    expect(getQuestionRuleSummary(rules, 'missing')).toEqual({
      firstRuleId: null,
      hasVisibility: false,
      hasBranch: false,
    })
  })
})
