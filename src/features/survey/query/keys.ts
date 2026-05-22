import type { QueryParams } from '@/types/api'

/** React Query key 工厂 — 统一 survey 命名空间 */
export const surveyKeys = {
  all: ['survey'] as const,
  lists: () => [...surveyKeys.all, 'list'] as const,
  list: (params?: QueryParams) => [...surveyKeys.lists(), params] as const,
  details: () => [...surveyKeys.all, 'detail'] as const,
  detail: (id: string) => [...surveyKeys.details(), id] as const,
  stats: (id: string) => [...surveyKeys.all, 'stats', id] as const,
  response: (id: string, params?: QueryParams) =>
    [...surveyKeys.all, 'response', id, params] as const,
}
