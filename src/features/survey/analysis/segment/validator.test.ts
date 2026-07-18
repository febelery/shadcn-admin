import { describe, expect, it } from 'vitest'
import type { SegmentDefinition } from '../../core/analysis-schema'
import type { QuestionElement } from '../../core/types'
import { getConditionIssues } from './validator'

const dateQuestion: QuestionElement<'date'> = {
  id: 'date-1',
  kind: 'question',
  type: 'date',
  title: '到店日期',
  required: false,
  config: {},
}

function issuesFor(conditions: SegmentDefinition['conditions']) {
  return getConditionIssues(
    [{ id: 'segment-1', label: '日期范围', conditions }],
    new Map([[dateQuestion.id, dateQuestion]])
  )
}

describe('segment date validation', () => {
  it('detects contradictory date bounds by timestamp semantics', () => {
    const issues = issuesFor([
      {
        questionId: dateQuestion.id,
        operator: 'gte',
        value: '2026-07-20',
      },
      {
        questionId: dateQuestion.id,
        operator: 'lte',
        value: '2026-07-10',
      },
    ])

    expect(issues).toHaveLength(2)
    expect(issues.every((issue) => issue.message === '日期条件互相冲突')).toBe(
      true
    )
  })

  it('detects a reversed between range', () => {
    expect(
      issuesFor([
        {
          questionId: dateQuestion.id,
          operator: 'between',
          value: '2026-07-20',
          value2: '2026-07-10',
        },
      ])[0]?.message
    ).toBe('日期条件互相冲突')
  })
})
