import { describe, expect, it } from 'vitest'
import { parseSurveyDocument } from './document-schema'
import { createEmptySurvey, createSection } from './schema-defaults'

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
})
