import { describe, expect, it } from 'vitest'
import type { SurveyRecordItem } from '../core/admin-data-schema'
import type { QuestionElement } from '../core/types'
import { createRecordGridColumns } from './columns'

function choiceQuestion(label: string): QuestionElement {
  return {
    id: 'question-1',
    kind: 'question',
    type: 'single_choice',
    title: 'Choice',
    required: false,
    config: { options: [{ id: 'option-1', label }] },
  }
}

const record: SurveyRecordItem = {
  id: 'record-1',
  surveyId: 'survey-1',
  status: 'complete',
  answers: { 'question-1': 'option-1' },
  startedAt: '2026-07-18T00:00:00.000Z',
}

describe('record answer columns', () => {
  it('keeps the option ID as data and resolves the current label in metadata', () => {
    const column = createRecordGridColumns([
      choiceQuestion('Renamed label'),
    ]).find((item) => item.id === 'answer_question-1')!
    const accessor = (
      column as {
        accessorFn: (row: SurveyRecordItem, index: number) => unknown
      }
    ).accessorFn
    const cell = column.meta?.cell

    expect(accessor(record, 0)).toBe('option-1')
    expect(cell).toMatchObject({
      variant: 'select',
      options: [{ value: 'option-1', label: 'Renamed label' }],
    })
  })
})
