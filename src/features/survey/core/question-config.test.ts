import { createAllTypesDemoSurvey } from '@/mocks/fixtures/survey-all-types-demo'
import { describe, expect, it } from 'vitest'
import { parseSurveyDocument } from './document-schema'
import {
  applyQuestionConfigPatch,
  parseQuestionConfig,
} from './question-config'
import {
  QUESTION_DEFINITIONS,
  getQuestionDefinition,
} from './question-definitions'
import { createEmptySurvey } from './schema-defaults'

describe('question config module', () => {
  it('owns valid defaults for every registered question type', () => {
    for (const definition of QUESTION_DEFINITIONS) {
      const question = definition.create()
      expect(() =>
        parseQuestionConfig(question.type, question.config)
      ).not.toThrow()

      const document = createEmptySurvey(definition.label)
      document.sections[0].elements = [question]
      expect(() => parseSurveyDocument(document)).not.toThrow()
    }
  })

  it('accepts the complete development document without normalization', () => {
    expect(parseSurveyDocument(createAllTypesDemoSurvey())).toBeDefined()
  })

  it('rejects structurally invalid and cross-type config', () => {
    expect(() =>
      parseQuestionConfig('single_choice', { options: [] })
    ).toThrow()
    expect(() =>
      parseQuestionConfig('number', { minValue: 10, maxValue: 2 })
    ).toThrow()
    expect(() =>
      parseQuestionConfig('slider', {
        minValue: 0,
        maxValue: 100,
        step: 0,
      })
    ).toThrow()
    expect(() =>
      parseQuestionConfig('signature', { placeholder: 'not supported' })
    ).toThrow()
  })

  it('normalizes dependent values as one edit transaction', () => {
    const slider = QUESTION_DEFINITIONS.find(
      (definition) => definition.type === 'slider'
    )!.create()
    const next = applyQuestionConfigPatch(slider, { minValue: 100 })

    expect(next).toMatchObject({ minValue: 100, maxValue: 101, step: 1 })
    expect(() => parseQuestionConfig('slider', next)).not.toThrow()
  })

  it('rejects config fields owned by another question type', () => {
    const signature = QUESTION_DEFINITIONS.find(
      (definition) => definition.type === 'signature'
    )!.create()

    expect(() =>
      applyQuestionConfigPatch(signature, {
        placeholder: 'not supported',
      } as never)
    ).toThrow()
  })

  it('derives the other-choice capability from the option itself', () => {
    expect(() =>
      parseQuestionConfig('single_choice', {
        options: [{ id: 'other', label: '', isOther: true }],
      })
    ).not.toThrow()

    expect(() =>
      parseQuestionConfig('dropdown', {
        options: [{ id: 'other', label: '其他', isOther: true }],
      })
    ).toThrow()
  })

  it('keeps multiple-choice limits within the edited option set', () => {
    const multipleChoice = getQuestionDefinition('multiple_choice').create()
    multipleChoice.config.maxSelect = 2

    const next = applyQuestionConfigPatch(multipleChoice, {
      options: multipleChoice.config.options.slice(0, 1),
    })

    expect(next.maxSelect).toBe(1)
  })

  it('rejects extra fields inside nested identity objects', () => {
    expect(() =>
      parseQuestionConfig('matrix_single', {
        rows: [{ id: 'row', label: '行', legacyValue: 'row' }],
        columns: [{ id: 'column', label: '列' }],
      })
    ).toThrow()
  })
})
