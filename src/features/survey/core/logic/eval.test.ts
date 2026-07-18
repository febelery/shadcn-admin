import { describe, expect, it } from 'vitest'
import type { QuestionElement } from '../types'
import { evaluateCondition, evaluateRuleCondition } from './eval'

const dateQuestion: QuestionElement = {
  id: 'date',
  kind: 'question',
  type: 'date',
  title: 'Date',
  required: false,
  config: {},
}

describe('evaluateCondition', () => {
  it('compares date values chronologically', () => {
    expect(
      evaluateCondition('2026-07-18', dateQuestion, 'gt', '2026-07-01')
    ).toBe(true)
    expect(
      evaluateCondition('2026-07-18', dateQuestion, 'lt', '2026-08-01')
    ).toBe(true)
    expect(
      evaluateCondition('2026-07-18', dateQuestion, 'gt', 'not-a-date')
    ).toBe(false)
  })

  it('evaluates the persisted structured condition directly', () => {
    expect(
      evaluateRuleCondition('2026-07-18', dateQuestion, {
        questionId: dateQuestion.id,
        operator: 'gte',
        value: '2026-07-18',
      })
    ).toBe(true)
  })
})
