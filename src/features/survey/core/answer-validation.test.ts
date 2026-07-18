import { describe, expect, it } from 'vitest'
import {
  isAnswerEmpty,
  validateQuestionAnswer,
  type AnswerValidationContext,
} from './answer-validation'
import type { QuestionConfig, QuestionElement, QuestionType } from './types'

const visible: AnswerValidationContext = { visible: true }

function question<Type extends QuestionType>(
  type: Type,
  config: QuestionConfig<Type>,
  required = false
): QuestionElement<Type> {
  return {
    id: `question-${type}`,
    kind: 'question',
    type,
    title: type,
    required,
    config,
  } as QuestionElement<Type>
}

function expectValid(question: QuestionElement, answer: unknown) {
  expect(validateQuestionAnswer(question, answer, visible)).toEqual({
    valid: true,
    issues: [],
  })
}

function expectInvalid(question: QuestionElement, answer: unknown) {
  const result = validateQuestionAnswer(question, answer, visible)
  expect(result.valid).toBe(false)
  expect(result.issues.length).toBeGreaterThan(0)
}

describe('question answer validation interface', () => {
  it('applies visibility before required semantics', () => {
    const required = question('text', {}, true)

    expect(
      validateQuestionAnswer(required, undefined, { visible: false })
    ).toEqual({ valid: true, issues: [] })
    expect(validateQuestionAnswer(required, '   ', visible)).toMatchObject({
      valid: false,
      issues: [{ code: 'required', path: [] }],
    })
    expectValid(question('text', {}), '')
  })

  it('recognizes empty structured answers without treating zero as empty', () => {
    expect(isAnswerEmpty({})).toBe(true)
    expect(isAnswerEmpty({ row: [] })).toBe(false)
    expect(isAnswerEmpty({ start: '', end: '' })).toBe(false)
    expect(isAnswerEmpty(0)).toBe(false)
  })

  it('validates choice identities, cardinality and uniqueness', () => {
    const options = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ]
    const single = question('single_choice', { options })
    const dropdown = question('dropdown', { options })
    const multiple = question('multiple_choice', {
      options,
      minSelect: 2,
      maxSelect: 2,
    })

    expectValid(single, 'a')
    expectInvalid(single, 'A')
    expectValid(dropdown, 'b')
    expectValid(multiple, ['a', 'b'])
    expectInvalid(multiple, ['a'])
    expectInvalid(multiple, ['a', 'a'])
    expectInvalid(multiple, ['a', 'b', 'c'])
  })

  it('requires a ranking to contain every option exactly once', () => {
    const ranking = question('ranking', {
      options: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
      ],
    })

    expectValid(ranking, ['c', 'a', 'b'])
    expectInvalid(ranking, ['a', 'b'])
    expectInvalid(ranking, ['a', 'b', 'b'])
  })

  it('validates matrix row and column identities', () => {
    const rows = [
      { id: 'service', label: '服务' },
      { id: 'room', label: '客房' },
    ]
    const columns = [
      { id: 'good', label: '好' },
      { id: 'bad', label: '差' },
    ]
    const single = question('matrix_single', { rows, columns }, true)
    const multiple = question('matrix_multiple', { rows, columns })

    expectValid(single, { service: 'good', room: 'bad' })
    expectInvalid(single, { service: 'good' })
    expectInvalid(single, { service: 'good', room: 'missing' })
    expectInvalid(single, {
      service: 'good',
      room: 'bad',
      legacyRow: 'good',
    })

    expectValid(multiple, { service: ['good', 'bad'] })
    expectInvalid(multiple, { service: [] })
    expectInvalid(multiple, { service: ['good', 'good'] })
  })

  it('accepts only continuous cascader paths ending at a leaf', () => {
    const cascader = question('cascader', {
      cascaderOptions: [
        {
          id: 'country',
          label: '国家',
          children: [
            {
              id: 'province',
              label: '省份',
              children: [{ id: 'city', label: '城市' }],
            },
          ],
        },
      ],
    })

    expectValid(cascader, ['country', 'province', 'city'])
    expectInvalid(cascader, ['country'])
    expectInvalid(cascader, ['country', 'city'])
    expectInvalid(cascader, ['missing'])
  })

  it('uses mature format validators while leaving phone numbering policy open', () => {
    const text = question('text', { minLength: 2, maxLength: 4 })
    const textarea = question('textarea', { minLength: 2, maxLength: 8 })
    const email = question('email', {})
    const url = question('url', {})
    const phone = question('phone', {})

    expectValid(text, '问卷')
    expectInvalid(text, 'a')
    expectInvalid(text, 'abcde')
    expectValid(textarea, '详细反馈')
    expectValid(email, 'person@example.com')
    expectInvalid(email, 'person@example')
    expectValid(url, 'https://example.com/path')
    expectInvalid(url, 'ftp://example.com/file')
    expectValid(phone, '+44 20 7946 0958 ext. 2')
  })

  it('validates finite numbers against range and step', () => {
    const number = question('number', {
      minValue: 0.1,
      maxValue: 1,
      step: 0.1,
    })

    expectValid(number, 0.3)
    expectInvalid(number, '0.3')
    expectInvalid(number, Number.NaN)
    expectInvalid(number, 0)
    expectInvalid(number, 0.35)
  })

  it('validates ISO dates, configured limits and range ordering', () => {
    const date = question('date', {
      minDate: '2026-07-01',
      maxDate: '2026-07-31',
    })
    const range = question('date_range', {
      minDate: '2026-07-01',
      maxDate: '2026-07-31',
    })

    expectValid(date, '2026-07-18')
    expectInvalid(date, '2026-7-18')
    expectInvalid(date, '2026-08-01')
    expectValid(range, { start: '2026-07-10', end: '2026-07-18' })
    expectInvalid(range, { start: '2026-07-18', end: '2026-07-10' })
    expectInvalid(range, { start: '2026-07-18' })
  })

  it('validates rating, slider, NPS and Likert ranges', () => {
    const rating = question('rating', { starCount: 5 })
    const slider = question('slider', {
      minValue: 10,
      maxValue: 20,
      step: 2,
    })
    const nps = question('nps', {})
    const likert = question(
      'likert',
      {
        statements: [
          { id: 'quality', label: '质量' },
          { id: 'value', label: '价值' },
        ],
        scaleMin: 1,
        scaleMax: 5,
      },
      true
    )

    expectValid(rating, 5)
    expectInvalid(rating, 0)
    expectInvalid(rating, 4.5)
    expectValid(slider, 16)
    expectInvalid(slider, 15)
    expectValid(nps, 10)
    expectInvalid(nps, 11)
    expectValid(likert, { quality: 5, value: 1 })
    expectInvalid(likert, { quality: 5 })
    expectInvalid(likert, { quality: 6, value: 1 })
  })
})
