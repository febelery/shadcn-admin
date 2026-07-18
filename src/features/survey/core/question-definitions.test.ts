import { describe, expect, it } from 'vitest'
import {
  QUESTION_DEFINITIONS,
  getQuestionDefinition,
} from './question-definitions'
import { QUESTION_TYPES } from './types'

describe('question definitions', () => {
  it('defines every question type exactly once', () => {
    expect(QUESTION_DEFINITIONS.map((item) => item.type)).toEqual(
      QUESTION_TYPES
    )
    expect(new Set(QUESTION_DEFINITIONS.map((item) => item.type)).size).toBe(
      QUESTION_TYPES.length
    )
  })

  it.each(QUESTION_TYPES)('creates a valid %s question', (type) => {
    const question = getQuestionDefinition(type).create()

    expect(question).toMatchObject({ kind: 'question', type, required: false })
    expect(question.id).toBeTruthy()
  })

  it('keeps rule and inspector capabilities with the definition', () => {
    expect(getQuestionDefinition('single_choice')).toMatchObject({
      family: 'choice',
      inspectorTitle: '选项',
      inspectorDefaultOpen: true,
      operatorProfile: 'choice',
      ruleSource: true,
    })
    expect(getQuestionDefinition('matrix_single')).toMatchObject({
      family: 'matrix',
      inspectorTitle: '矩阵',
      ruleSource: false,
    })
  })
})
