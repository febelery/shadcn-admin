import { describe, expect, it } from 'vitest'
import { createEmptySurvey } from '../schema-defaults'
import type { QuestionElement, Rule, RuleCondition } from '../types'
import { analyseSurvey } from './analyzer'

function question(
  id: string,
  type: QuestionElement['type'],
  required = false
): QuestionElement {
  return {
    id,
    kind: 'question',
    type,
    title: id,
    required,
    config:
      type === 'single_choice'
        ? { options: [{ id: 'yes', label: 'Yes' }] }
        : {},
  }
}

function rule(condition: RuleCondition, action: Rule['action']): Rule {
  return {
    id: 'rule-1',
    name: 'Test rule',
    enabled: true,
    priority: 0,
    condition,
    action,
  }
}

function documentWith(ruleValue: Rule) {
  const document = createEmptySurvey()
  document.sections[0].elements = [
    question('source', 'single_choice'),
    question('target', 'text', true),
  ]
  document.rules = [ruleValue]
  return document
}

describe('rule analyzer', () => {
  it('rejects stale option identities', () => {
    const document = documentWith(
      rule(
        { questionId: 'source', operator: 'eq', value: 'removed-option' },
        { id: 'action-1', type: 'show', target: 'target' }
      )
    )

    expect(analyseSurvey(document)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'condition_value',
          severity: 'error',
        }),
      ])
    )
  })

  it('rejects operators that do not belong to the source type', () => {
    const document = documentWith(
      rule(
        { questionId: 'source', operator: 'gt', value: 1 },
        { id: 'action-1', type: 'show', target: 'target' }
      )
    )

    expect(analyseSurvey(document)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'condition_operator',
          severity: 'error',
        }),
      ])
    )
  })

  it('allows required questions to be conditionally hidden', () => {
    const document = documentWith(
      rule(
        { questionId: 'source', operator: 'eq', value: 'yes' },
        { id: 'action-1', type: 'hide', target: 'target' }
      )
    )

    expect(analyseSurvey(document)).toEqual([])
  })
})
