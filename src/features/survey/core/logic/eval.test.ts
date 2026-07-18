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

const choiceQuestion: QuestionElement = {
  id: 'choice',
  kind: 'question',
  type: 'single_choice',
  title: 'Choice',
  required: false,
  config: { options: [{ id: 'option-1', label: 'Renamed label' }] },
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

  it('matches choice answers by option identity instead of label', () => {
    const condition = {
      questionId: choiceQuestion.id,
      operator: 'eq' as const,
      value: 'option-1',
    }

    expect(evaluateRuleCondition('option-1', choiceQuestion, condition)).toBe(
      true
    )
    expect(
      evaluateRuleCondition('Renamed label', choiceQuestion, condition)
    ).toBe(false)
  })
})
