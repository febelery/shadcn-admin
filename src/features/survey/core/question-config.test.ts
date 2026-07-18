import { createAllTypesDemoSurvey } from '@/mocks/fixtures/survey-all-types-demo'
import { describe, expect, it } from 'vitest'
import { createEmptySurvey } from './document-factory'
import { parseSurveyDocument } from './document-schema'
import {
  applyQuestionConfigPatch,
  parseQuestionConfig,
} from './question-config'
import { createQuestion } from './question-factory'
import { QUESTION_TYPES } from './types'

describe('question config module', () => {
  it('owns valid defaults for every registered question type', () => {
    for (const type of QUESTION_TYPES) {
      const question = createQuestion(type)
      expect(() =>
        parseQuestionConfig(question.type, question.config)
      ).not.toThrow()

      const document = createEmptySurvey(type)
      document.elements = [question]
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
      parseQuestionConfig('rating', {
        starCount: 5,
        placeholder: 'not supported',
      })
    ).toThrow()
  })

  it('normalizes dependent values as one edit transaction', () => {
    const slider = createQuestion('slider')
    const next = applyQuestionConfigPatch(slider, { minValue: 100 })

    expect(next).toMatchObject({ minValue: 100, maxValue: 101, step: 1 })
    expect(() => parseQuestionConfig('slider', next)).not.toThrow()
  })

  it('rejects config fields owned by another question type', () => {
    const rating = createQuestion('rating')

    expect(() =>
      applyQuestionConfigPatch(rating, {
        placeholder: 'not supported',
      } as never)
    ).toThrow()
  })

  it('rejects removed free-text choice fields', () => {
    expect(() =>
      parseQuestionConfig('single_choice', {
        options: [{ id: 'other', label: '', isOther: true }],
      })
    ).toThrow()

    expect(() =>
      parseQuestionConfig('single_choice', {
        options: [{ id: 'other', label: '其他' }],
        otherPlaceholder: '请说明',
      })
    ).toThrow()
  })

  it('rejects the removed datetime mode without an instant contract', () => {
    expect(() =>
      parseQuestionConfig('date', { dateMode: 'datetime' })
    ).toThrow()
  })

  it('keeps multiple-choice limits within the edited option set', () => {
    const multipleChoice = createQuestion('multiple_choice')
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
