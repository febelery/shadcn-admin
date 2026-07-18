import { describe, expect, it } from 'vitest'
import type { SegmentCondition } from '../../core/analysis-types'
import type { QuestionElement } from '../../core/types'
import { getDefaultValue, getSelectionDescription } from './utils'

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
})
