import { describe, expect, it } from 'vitest'
import { createEmptySurvey, createSection } from './document-factory'
import { parseSurveyDocument } from './document-schema'

describe('parseSurveyDocument', () => {
  it('accepts the current document contract', () => {
    const document = createEmptySurvey('Customer feedback')

    expect(parseSurveyDocument(document)).toEqual(document)
  })

  it('keeps schema format and publish revision as separate concepts', () => {
    const document = createEmptySurvey()
    const { schemaVersion: _schemaVersion, ...legacyDocument } = document

    expect(() =>
      parseSurveyDocument({
        ...document,
        schemaVersion: 2,
      })
    ).toThrow()
    expect(() =>
      parseSurveyDocument({
        ...document,
        revision: -1,
      })
    ).toThrow()
    expect(() =>
      parseSurveyDocument({
        ...legacyDocument,
        version: '4',
      })
    ).toThrow()
  })

  it('rejects unsupported pages instead of flattening them', () => {
    const document = createEmptySurvey()

    expect(() =>
      parseSurveyDocument({
        ...document,
        sections: [...document.sections, createSection()],
      })
    ).toThrow()
  })

  it('rejects duplicate document and rule identities', () => {
    const document = createEmptySurvey()
    const firstQuestion = {
      kind: 'question' as const,
      id: 'duplicate-question',
      type: 'text' as const,
      title: '第一题',
      required: false,
      config: {},
    }
    document.sections[0].elements = [
      firstQuestion,
      { ...firstQuestion, title: '第二题' },
    ]

    expect(() => parseSurveyDocument(document)).toThrow(/element ID/)

    document.sections[0].elements = []
    document.rules = [
      {
        id: 'duplicate-rule',
        name: '规则一',
        enabled: true,
        priority: 0,
        condition: { questionId: 'question', operator: 'not_empty' },
        action: { id: 'action-1', type: 'end' },
      },
      {
        id: 'duplicate-rule',
        name: '规则二',
        enabled: true,
        priority: 1,
        condition: { questionId: 'question', operator: 'not_empty' },
        action: { id: 'action-2', type: 'end' },
      },
    ]

    expect(() => parseSurveyDocument(document)).toThrow(/rule ID/)
  })

  it('rejects unknown fields instead of silently stripping them', () => {
    const document = createEmptySurvey()
    expect(() =>
      parseSurveyDocument({ ...document, unexpectedField: true })
    ).toThrow()
    expect(() =>
      parseSurveyDocument({
        ...document,
        submission: { ...document.submission, unsupported: true },
      })
    ).toThrow()
  })

  it('rejects the removed string DSL and between rule operator', () => {
    const document = createEmptySurvey()
    const baseRule = {
      id: 'rule-1',
      name: 'Rule',
      enabled: true,
      priority: 0,
      action: { id: 'action-1', type: 'end' },
    }

    expect(() =>
      parseSurveyDocument({
        ...document,
        rules: [{ ...baseRule, when: '{q.q1} notEmpty' }],
      })
    ).toThrow()
    expect(() =>
      parseSurveyDocument({
        ...document,
        rules: [
          {
            ...baseRule,
            condition: {
              questionId: 'q1',
              operator: 'between',
              value: 1,
              value2: 2,
            },
          },
        ],
      })
    ).toThrow()
  })
})
