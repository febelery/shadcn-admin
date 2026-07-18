import { describe, expect, it } from 'vitest'
import { createEmptySurvey } from './document-factory'
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
        schemaVersion: 3,
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

  it('rejects removed section containers instead of flattening them', () => {
    const document = createEmptySurvey()

    expect(() =>
      parseSurveyDocument({
        ...document,
        sections: [{ id: 'legacy-section', elements: [] }],
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
    document.elements = [firstQuestion, { ...firstQuestion, title: '第二题' }]

    expect(() => parseSurveyDocument(document)).toThrow(/element ID/)

    document.elements = []
    document.rules = [
      {
        id: 'duplicate-rule',
        name: '规则一',
        enabled: true,
        condition: { questionId: 'question', operator: 'not_empty' },
        action: { id: 'action-1', type: 'end' },
      },
      {
        id: 'duplicate-rule',
        name: '规则二',
        enabled: true,
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
        submissionPolicy: {
          ...document.submissionPolicy,
          unsupported: true,
        },
      })
    ).toThrow()
  })

  it('rejects removed placeholder capabilities', () => {
    const document = createEmptySurvey()

    expect(() =>
      parseSurveyDocument({
        ...document,
        rules: [
          {
            id: 'legacy-priority-rule',
            name: '旧顺序字段',
            enabled: true,
            priority: 10,
            condition: { questionId: 'q1', operator: 'not_empty' },
            action: { id: 'legacy-priority-action', type: 'end' },
          },
        ],
      })
    ).toThrow()
    expect(() => parseSurveyDocument({ ...document, submission: {} })).toThrow()
    expect(() => parseSurveyDocument({ ...document, variables: [] })).toThrow()
    expect(() => parseSurveyDocument({ ...document, validators: [] })).toThrow()
    expect(() => parseSurveyDocument({ ...document, extensions: {} })).toThrow()
    expect(() =>
      parseSurveyDocument({
        ...document,
        elements: [
          {
            kind: 'panel',
            id: 'legacy-panel',
            elements: [],
          },
        ],
      })
    ).toThrow()
    expect(() =>
      parseSurveyDocument({
        ...document,
        elements: [
          {
            kind: 'question',
            id: 'legacy-dynamic-panel',
            type: 'dynamic_panel',
            title: '重复组',
            required: false,
            config: { templateElements: [], minItems: 0, maxItems: 1 },
          },
        ],
      })
    ).toThrow()
  })

  it('validates the submission policy', () => {
    const document = createEmptySurvey()

    expect(() =>
      parseSurveyDocument({
        ...document,
        submissionPolicy: { totalLimit: 0 },
      })
    ).toThrow()
    expect(() =>
      parseSurveyDocument({
        ...document,
        submissionPolicy: { opensAt: 'not-a-date' },
      })
    ).toThrow()
    expect(() =>
      parseSurveyDocument({
        ...document,
        submissionPolicy: {
          opensAt: '2026-07-19T12:00:00.000Z',
          closesAt: '2026-07-18T12:00:00.000Z',
        },
      })
    ).toThrow(/结束时间/)
  })

  it('rejects the removed string DSL and between rule operator', () => {
    const document = createEmptySurvey()
    const baseRule = {
      id: 'rule-1',
      name: 'Rule',
      enabled: true,
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
