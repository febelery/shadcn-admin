import { describe, expect, it } from 'vitest'
import { createQuestion } from './question-factory'
import { QUESTION_TYPES } from './types'

describe('question factory', () => {
  it.each(QUESTION_TYPES)('creates a valid %s question', (type) => {
    const question = createQuestion(type)

    expect(question).toMatchObject({ kind: 'question', type, required: false })
    expect(question.id).toBeTruthy()
  })

  it('creates fresh nested identities for every question', () => {
    const first = createQuestion('single_choice')
    const second = createQuestion('single_choice')

    expect(second.id).not.toBe(first.id)
    expect(second.config.options[0].id).not.toBe(first.config.options[0].id)
  })
})
