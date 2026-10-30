import {
  matchFilterValue,
  parseQueryFilterParam,
} from '@/lib/data-grid-filters'
import type { SurveyRecordItem } from '@/features/survey/core/admin-data-schema'
import type { SurveyAnalysisResult } from '@/features/survey/core/analysis-schema'
import { flattenQuestions } from '@/features/survey/core/document-elements'
import type { SurveyDocument } from '@/features/survey/core/types'

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
