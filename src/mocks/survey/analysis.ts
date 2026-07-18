import {
  matchFilterValue,
  parseQueryFilterParam,
} from '@/lib/data-grid-filters'
import type { SurveyRecordItem } from '@/features/survey/core/admin-data-schema'
import type {
  SegmentDefinition,
  SurveyAnalysisResult,
  SurveySegmentAnalysisResult,
} from '@/features/survey/core/analysis-schema'
import { parseSegmentDefinitions } from '@/features/survey/core/analysis-schema'
import { flattenQuestions } from '@/features/survey/core/document-elements'
import { evaluateCondition } from '@/features/survey/core/logic/eval'
import type {
  QuestionElement,
  SurveyDocument,
} from '@/features/survey/core/types'

export function filterSurveyRecords(
  document: SurveyDocument,
  records: SurveyRecordItem[],
  searchParams: URLSearchParams
): SurveyRecordItem[] {
  const filters: {
    key: string
    filter: NonNullable<ReturnType<typeof parseQueryFilterParam>>
  }[] = []
  const addFilter = (key: string) => {
    const filter = parseQueryFilterParam(searchParams.get(key))
    if (filter) filters.push({ key, filter })
  }

  addFilter('status')
  addFilter('completedAt')
  flattenQuestions(document).forEach((question) => addFilter(question.id))

  if (filters.length === 0) return records

  return records.filter((record) =>
    filters.every(({ key, filter }) => {
      const value =
        key === 'status'
          ? record.status
          : key === 'completedAt'
            ? record.completedAt
            : record.answers[key]
      return matchFilterValue(value, filter)
    })
  )
}

export function createSurveyAnalysis(
  surveyId: string,
  records: SurveyRecordItem[],
  today = new Date()
): SurveyAnalysisResult {
  const completeRecords = records.filter(
    (record) => record.status === 'complete'
  ).length
  const durations = records.flatMap((record) =>
    record.durationMs === undefined ? [] : [record.durationMs]
  )
  const durationTotal = durations.reduce((total, value) => total + value, 0)

  const dailyCounts = new Map<string, number>()
  for (let dayOffset = 29; dayOffset >= 0; dayOffset -= 1) {
    const date = new Date(today.getTime() - dayOffset * 24 * 60 * 60 * 1000)
    dailyCounts.set(date.toISOString().slice(0, 10), 0)
  }
  for (const record of records) {
    const date = (record.completedAt ?? record.startedAt).slice(0, 10)
    dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + 1)
  }

  return {
    surveyId,
    overview: {
      totalRecords: records.length,
      completeRecords,
      partialRecords: records.length - completeRecords,
      avgDurationMs:
        durations.length === 0
          ? 0
          : Math.round(durationTotal / durations.length),
      dailyTrend: Array.from(dailyCounts, ([date, count]) => ({
        date,
        count,
      })).sort((left, right) => left.date.localeCompare(right.date)),
    },
  }
}

export function decodeSegmentDefinitions(value: string | null) {
  if (!value) return []
  return parseSegmentDefinitions(JSON.parse(value))
}

export function createSurveySegmentAnalysis(
  surveyId: string,
  document: SurveyDocument,
  records: SurveyRecordItem[],
  segments: SegmentDefinition[]
): SurveySegmentAnalysisResult {
  const questions = flattenQuestions(document)
  const questionMap = new Map(
    questions.map((question) => [question.id, question])
  )

  return {
    surveyId,
    metric: 'count',
    metricLabel: '计数',
    total: records.length,
    segments: segments.map((segment) => {
      const count = records.filter((record) =>
        recordMatchesSegment(record, segment, questionMap)
      ).length
      return {
        id: segment.id,
        label: segment.label,
        count,
        percentage: records.length === 0 ? 0 : count / records.length,
        conditions: segment.conditions,
      }
    }),
  }
}

function recordMatchesSegment(
  record: SurveyRecordItem,
  segment: SegmentDefinition,
  questionMap: Map<string, QuestionElement>
) {
  if (segment.conditions.length === 0) return false
  return segment.conditions.every((condition) => {
    const question = questionMap.get(condition.questionId)
    if (!question) return false
    return evaluateCondition(
      record.answers[condition.questionId],
      question,
      condition.operator,
      condition.value,
      condition.value2
    )
  })
}
