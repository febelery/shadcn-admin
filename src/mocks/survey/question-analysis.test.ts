import { describe, expect, it } from 'vitest'
import type { SurveyRecordItem } from '@/features/survey/core/admin-data-schema'
import { parseQuestionAnalysis } from '@/features/survey/core/analysis-schema'
import type { QuestionElement } from '@/features/survey/core/types'
import { createQuestionAnalysis } from './question-analysis'

function record(
  id: string,
  questionId: string,
  answer: unknown
): SurveyRecordItem {
  return {
    id,
    surveyId: 'survey-1',
    status: 'complete',
    answers: { [questionId]: answer },
    startedAt: '2026-07-18T00:00:00.000Z',
  }
}

describe('survey question analysis', () => {
  it('uses the canonical empty-answer contract for choice denominators', () => {
    const question: QuestionElement<'multiple_choice'> = {
      kind: 'question',
      id: 'choice-1',
      type: 'multiple_choice',
      title: '多选题',
      required: false,
      config: {
        options: [
          { id: 'option-a', label: 'A' },
          { id: 'option-b', label: 'B' },
        ],
      },
    }

    const analysis = createQuestionAnalysis(question, [
      record('record-empty', question.id, []),
      record('record-a', question.id, ['option-a']),
    ])

    expect(analysis.type).toBe('multiple_choice')
    if (analysis.type === 'multiple_choice') {
      expect(analysis.options).toEqual([
        { optionId: 'option-a', label: 'A', count: 1, percentage: 1 },
        { optionId: 'option-b', label: 'B', count: 0, percentage: 0 },
      ])
    }
  })

  it('keeps ranking identity separate from display labels', () => {
    const question: QuestionElement<'ranking'> = {
      kind: 'question',
      id: 'ranking-1',
      type: 'ranking',
      title: '排序题',
      required: false,
      config: {
        options: [
          { id: 'option-a', label: 'A' },
          { id: 'option-b', label: 'B' },
        ],
      },
    }

    const analysis = createQuestionAnalysis(question, [
      record('record-1', question.id, ['option-a', 'option-b']),
      record('record-2', question.id, ['option-b', 'option-a']),
    ])

    expect(analysis.type).toBe('ranking')
    if (analysis.type === 'ranking') {
      expect(analysis.options).toEqual([
        {
          optionId: 'option-a',
          label: 'A',
          firstChoiceCount: 1,
          firstChoicePercentage: 0.5,
          averageRank: 1.5,
        },
        {
          optionId: 'option-b',
          label: 'B',
          firstChoiceCount: 1,
          firstChoicePercentage: 0.5,
          averageRank: 1.5,
        },
      ])
    }
  })

  it('preserves cascader path IDs and resolved labels', () => {
    const question: QuestionElement<'cascader'> = {
      kind: 'question',
      id: 'cascader-1',
      type: 'cascader',
      title: '地区',
      required: false,
      config: {
        cascaderOptions: [
          {
            id: 'china',
            label: '中国',
            children: [{ id: 'shanghai', label: '上海' }],
          },
        ],
      },
    }

    const analysis = createQuestionAnalysis(question, [
      record('record-1', question.id, ['china', 'shanghai']),
    ])

    expect(analysis.type).toBe('cascader')
    if (analysis.type === 'cascader') {
      expect(analysis.paths).toEqual([
        {
          pathIds: ['china', 'shanghai'],
          label: '中国 / 上海',
          count: 1,
          percentage: 1,
        },
      ])
    }
  })

  it('produces a response that satisfies the strict NPS contract', () => {
    const question: QuestionElement<'nps'> = {
      kind: 'question',
      id: 'nps-1',
      type: 'nps',
      title: '推荐意愿',
      required: false,
      config: {},
    }
    const analysis = createQuestionAnalysis(question, [
      record('record-promoter', question.id, 10),
      record('record-detractor', question.id, 0),
    ])

    expect(() => parseQuestionAnalysis(analysis)).not.toThrow()
    expect(analysis).toMatchObject({
      type: 'nps',
      npsScore: 0,
      promoters: 1,
      passives: 0,
      detractors: 1,
    })
  })

  it('reports exact numeric frequencies without fabricated buckets', () => {
    const question: QuestionElement<'number'> = {
      kind: 'question',
      id: 'number-1',
      type: 'number',
      title: '金额',
      required: false,
      config: {},
    }

    const empty = createQuestionAnalysis(question, [])
    expect(empty.type === 'number' && empty.distribution).toEqual([])

    const analysis = createQuestionAnalysis(question, [
      record('record-100-a', question.id, 100),
      record('record-1', question.id, 1),
      record('record-100-b', question.id, 100),
    ])
    expect(analysis.type === 'number' && analysis.distribution).toEqual([
      { score: 1, count: 1, percentage: 0.3333 },
      { score: 100, count: 2, percentage: 0.6667 },
    ])
  })
})
