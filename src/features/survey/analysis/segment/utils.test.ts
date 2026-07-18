import { describe, expect, it } from 'vitest'
import type { SegmentCondition } from '../../core/analysis-schema'
import type { QuestionElement } from '../../core/types'
import {
  getDefaultValue,
  getOperators,
  getSelectionDescription,
  isSupportedQuestion,
} from './utils'

const question: QuestionElement = {
  id: 'question-1',
  kind: 'question',
  type: 'single_choice',
  title: 'Choice',
  required: false,
  config: { options: [{ id: 'option-1', label: 'Renamed label' }] },
}

describe('segment choice identity', () => {
  it('stores option IDs and resolves labels only for presentation', () => {
    const condition: SegmentCondition = {
      questionId: question.id,
      operator: 'eq',
      value: 'option-1',
    }

    expect(getDefaultValue(question, 'eq')).toBe('option-1')
    expect(getSelectionDescription(condition, question)).toBe('Renamed label')
  })

  it('derives date support and operators from the core capability profile', () => {
    const dateQuestion: QuestionElement<'date'> = {
      id: 'date-1',
      kind: 'question',
      type: 'date',
      title: '到店日期',
      required: false,
      config: {},
    }

    expect(isSupportedQuestion(dateQuestion)).toBe(true)
    expect(getOperators(dateQuestion)).toContain('between')
  })
})
