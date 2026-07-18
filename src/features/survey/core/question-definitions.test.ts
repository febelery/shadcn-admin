import { describe, expect, it } from 'vitest'
import {
  QUESTION_DEFINITIONS,
  getQuestionDefinition,
} from './question-definitions'
import type { QuestionType } from './types'

const ALL_TYPES: QuestionType[] = [
  'single_choice',
  'multiple_choice',
  'dropdown',
  'ranking',
  'matrix_single',
  'matrix_multiple',
  'cascader',
  'text',
  'textarea',
  'number',
  'email',
  'phone',
  'url',
  'date',
  'date_range',
  'fill_in',
  'rating',
  'slider',
  'nps',
  'likert',
  'dynamic_panel',
  'file_upload',
  'signature',
]

describe('question definitions', () => {
  it('defines every question type exactly once', () => {
    expect(QUESTION_DEFINITIONS.map((item) => item.type)).toEqual(ALL_TYPES)
    expect(new Set(QUESTION_DEFINITIONS.map((item) => item.type)).size).toBe(
      ALL_TYPES.length
    )
  })

  it.each(ALL_TYPES)('creates a valid %s question', (type) => {
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
