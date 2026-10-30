import { describe, expect, it } from 'vitest'
import { createEmptySurvey } from '../document-factory'
import type { QuestionElement, Rule, RuleCondition } from '../types'
import { analyseSurvey, hasBlockingIssues } from './analyzer'

function question(
  id: string,
  type: 'single_choice' | 'text',
  required = false
): QuestionElement {
  return type === 'single_choice'
    ? {
        id,
        kind: 'question',
        type,
        title: id,
        required,
        config: { options: [{ id: 'yes', label: 'Yes' }] },
      }
    : { id, kind: 'question', type, title: id, required, config: {} }
}

function rule(condition: RuleCondition, action: Rule['action']): Rule {
  return {
    id: 'rule-1',
    name: 'Test rule',
    enabled: true,
    condition,
    action,
  }
}

function documentWith(ruleValue: Rule) {
  const document = createEmptySurvey()
  document.elements = [
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

  it('warns about consent gates that cannot actually bind', () => {
    const document = createEmptySurvey()
    document.submissionPolicy.consent = {
      clauses: [{ id: 'privacy', title: '隐私政策', content: '<p>短</p>' }],
      minReadSeconds: 3,
      requireScrollToEnd: true,
    }

    expect(analyseSurvey(document).map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'consent_token_timing',
        'consent_read_time',
        'consent_scroll_vacuous',
      ])
    )
  })

  it('blocks publish on a broken consent configuration', () => {
    const document = createEmptySurvey()
    document.submissionPolicy.consent = {
      clauses: [{ id: 'privacy', title: '隐私政策', content: '<p>   </p>' }],
    }

    expect(
      analyseSurvey(document)
        .filter((issue) => issue.severity === 'error')
        .map((issue) => issue.code)
    ).toContain('consent_config')
    expect(hasBlockingIssues(document)).toBe(true)
  })
})
