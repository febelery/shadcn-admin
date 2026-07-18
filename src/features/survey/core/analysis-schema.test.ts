import { describe, expect, it } from 'vitest'
import {
  parseQuestionAnalysis,
  parseSurveyAnalysis,
  parseSurveySegmentAnalysis,
} from './analysis-schema'

const numericFields = {
  questionId: 'question-1',
  title: '推荐意愿',
  avgScore: 8.2,
  medianScore: 9,
  minScore: 2,
  maxScore: 10,
  sumScore: 82,
  distribution: [{ score: 10, count: 4, percentage: 0.4 }],
}

describe('survey analysis contract', () => {
  it('requires NPS-specific metrics for NPS analysis', () => {
    const analysis = parseQuestionAnalysis({
      ...numericFields,
      type: 'nps',
      npsScore: 40,
      promoters: 6,
      passives: 2,
      detractors: 2,
    })

    expect(analysis.type).toBe('nps')
    if (analysis.type === 'nps') {
      expect(analysis.npsScore).toBe(40)
    }

    expect(() =>
      parseQuestionAnalysis({
        ...numericFields,
        type: 'nps',
      })
    ).toThrow()
  })

  it('rejects ratios outside the canonical zero-to-one range', () => {
    expect(() =>
      parseQuestionAnalysis({
        questionId: 'question-1',
        title: '单选题',
        type: 'single_choice',
        options: [
          {
            optionId: 'option-1',
            label: '选项一',
            count: 1,
            percentage: 40,
          },
        ],
      })
    ).toThrow()
  })

  it('parses overview and segment results through dedicated interfaces', () => {
    expect(
      parseSurveyAnalysis({
        surveyId: 'survey-1',
        overview: {
          totalRecords: 2,
          completeRecords: 1,
          partialRecords: 1,
          avgDurationMs: 30_000,
          dailyTrend: [{ date: '2026-07-18', count: 2 }],
        },
      }).overview.totalRecords
    ).toBe(2)

    expect(
      parseSurveySegmentAnalysis({
        surveyId: 'survey-1',
        metric: 'count',
        metricLabel: '计数',
        total: 2,
        segments: [
          {
            id: 'segment-1',
            label: '已完成',
            count: 1,
            percentage: 0.5,
            conditions: [
              {
                questionId: 'question-1',
                operator: 'not_empty',
              },
            ],
          },
        ],
      }).segments[0].count
    ).toBe(1)
  })
})
