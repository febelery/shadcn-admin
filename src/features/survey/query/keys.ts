import type { QueryParams } from '@/types/api'

/** React Query key 工厂 — 统一 survey 命名空间 */
export const surveyKeys = {
  all: ['survey'] as const,
  lists: () => [...surveyKeys.all, 'list'] as const,
  list: (params?: QueryParams) => [...surveyKeys.lists(), params] as const,
  details: () => [...surveyKeys.all, 'detail'] as const,
  detail: (id: string) => [...surveyKeys.details(), id] as const,
  record: (id: string, params?: QueryParams) =>
    [...surveyKeys.all, 'record', id, params] as const,
  recordAll: (id: string) => [...surveyKeys.all, 'record', id, 'all'] as const,
  analysis: (id: string, params?: QueryParams) =>
    [...surveyKeys.all, 'analysis', id, params] as const,
  questionAnalysis: (id: string, questionId: string, params?: QueryParams) =>
    [
      ...surveyKeys.all,
      'analysis',
      id,
      'question',
      questionId,
      params,
    ] as const,
  segmentAnalysis: (id: string, params?: QueryParams) =>
    [...surveyKeys.all, 'analysis', id, 'segment', params] as const,
}
