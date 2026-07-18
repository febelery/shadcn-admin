import { describe, expect, it } from 'vitest'
import {
  parseSurveyListResponse,
  parseSurveyRecordResponse,
} from './admin-data-schema'

const meta = {
  page: 1,
  pageSize: 10,
  total: 1,
  totalPages: 1,
}

describe('admin survey data contract', () => {
  it('parses list and record projections at the transport seam', () => {
    expect(
      parseSurveyListResponse({
        data: [
          {
            id: 'survey-1',
            title: '季度调研',
            description: '',
            status: 'draft',
            questionCount: 3,
            recordCount: 12,
            createdAt: '2026-07-18T00:00:00.000Z',
            updatedAt: '2026-07-18T01:00:00.000Z',
          },
        ],
        meta,
      }).data[0].status
    ).toBe('draft')

    expect(
      parseSurveyRecordResponse({
        data: [
          {
            id: 'record-1',
            surveyId: 'survey-1',
            status: 'complete',
            answers: { 'question-1': 'option-1' },
            startedAt: '2026-07-18T00:00:00.000Z',
            completedAt: '2026-07-18T00:01:00.000Z',
            durationMs: 60_000,
          },
        ],
        meta,
      }).data[0].answers
    ).toEqual({ 'question-1': 'option-1' })
  })

  it('rejects malformed server projections before they reach the UI', () => {
    expect(() =>
      parseSurveyListResponse({
        data: [
          {
            id: 'survey-1',
            title: '季度调研',
            description: '',
            status: 'draft',
            questionCount: -1,
            recordCount: 0,
            createdAt: 'not-a-date',
            updatedAt: '2026-07-18T01:00:00.000Z',
          },
        ],
        meta,
      })
    ).toThrow()
  })
})
