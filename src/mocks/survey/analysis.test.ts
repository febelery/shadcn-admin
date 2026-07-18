import { describe, expect, it } from 'vitest'
import type { SurveyRecordItem } from '@/features/survey/core/admin-data-schema'
import type { SegmentDefinition } from '@/features/survey/core/analysis-schema'
import type { SurveyDocument } from '@/features/survey/core/types'
import {
  createSurveyAnalysis,
  createSurveySegmentAnalysis,
  decodeSegmentDefinitions,
  filterSurveyRecords,
} from './analysis'

const document: SurveyDocument = {
  id: 'survey-1',
  schemaVersion: 2,
  revision: 0,
  status: 'draft',
  meta: {
    title: '测试问卷',
    description: '',
    coverType: 'none',
    submitLabel: '提交',
    endTitle: '完成',
    endDescription: '',
  },
  theme: {
    primaryColor: '#000000',
    backgroundColor: '#ffffff',
    borderRadius: '0.5rem',
  },
  elements: [
    {
      kind: 'question',
      id: 'choice-1',
      type: 'single_choice',
      title: '选择',
      required: false,
      config: {
        options: [
          { id: 'option-a', label: 'A' },
          { id: 'option-b', label: 'B' },
        ],
      },
    },
    {
      kind: 'question',
      id: 'number-1',
      type: 'number',
      title: '年龄',
      required: false,
      config: {},
    },
  ],
  rules: [],
  submissionPolicy: {},
}

const records: SurveyRecordItem[] = [
  {
    id: 'record-1',
    surveyId: document.id,
    status: 'complete',
    answers: { 'choice-1': 'option-a', 'number-1': 20 },
    startedAt: '2026-07-18T00:00:00.000Z',
    completedAt: '2026-07-18T00:00:01.000Z',
    durationMs: 1_000,
  },
  {
    id: 'record-2',
    surveyId: document.id,
    status: 'partial',
    answers: { 'choice-1': 'option-b', 'number-1': 30 },
    startedAt: '2026-07-17T00:00:00.000Z',
  },
]

describe('survey mock analysis', () => {
  it('applies status and answer filters through one shared path', () => {
    const params = new URLSearchParams({
      status: JSON.stringify({ operator: 'is', value: 'complete' }),
      'choice-1': JSON.stringify({ operator: 'is', value: 'option-a' }),
    })

    expect(filterSurveyRecords(document, records, params)).toEqual([records[0]])
  })

  it('computes overview values against an injected clock', () => {
    const result = createSurveyAnalysis(
      document.id,
      records,
      new Date('2026-07-18T12:00:00.000Z')
    )

    expect(result.overview).toMatchObject({
      totalRecords: 2,
      completeRecords: 1,
      partialRecords: 1,
      avgDurationMs: 1_000,
    })
    expect(result.overview.dailyTrend).toHaveLength(30)
    expect(result.overview.dailyTrend.slice(-2)).toEqual([
      { date: '2026-07-17', count: 1 },
      { date: '2026-07-18', count: 1 },
    ])
  })

  it('uses canonical rule evaluation for segment counts', () => {
    const segments: SegmentDefinition[] = [
      {
        id: 'segment-choice',
        label: '选择 A',
        conditions: [
          { questionId: 'choice-1', operator: 'eq', value: 'option-a' },
        ],
      },
      {
        id: 'segment-range',
        label: '18 到 25 岁',
        conditions: [
          {
            questionId: 'number-1',
            operator: 'between',
            value: 18,
            value2: 25,
          },
        ],
      },
    ]

    expect(
      createSurveySegmentAnalysis(document.id, document, records, segments)
        .segments
    ).toEqual([
      { ...segments[0], count: 1, percentage: 0.5 },
      { ...segments[1], count: 1, percentage: 0.5 },
    ])
  })

  it('rejects malformed serialized segment definitions', () => {
    expect(decodeSegmentDefinitions(JSON.stringify([]))).toEqual([])
    expect(() =>
      decodeSegmentDefinitions(
        JSON.stringify([
          {
            id: 'segment-1',
            label: '错误条件',
            conditions: [],
            unexpected: true,
          },
        ])
      )
    ).toThrow()
    expect(() => decodeSegmentDefinitions('{')).toThrow()
  })
})
