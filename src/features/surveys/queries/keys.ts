import type { QueryParams } from '@/types/api'

/** React Query key 工厂 — 统一 surveys 命名空间 */
export const surveysKeys = {
  all: ['surveys'] as const,
  lists: () => [...surveysKeys.all, 'list'] as const,
  list: (params?: QueryParams) => [...surveysKeys.lists(), params] as const,
  details: () => [...surveysKeys.all, 'detail'] as const,
  detail: (id: string) => [...surveysKeys.details(), id] as const,
  stats: (id: string) => [...surveysKeys.all, 'stats', id] as const,
  responses: (id: string, params?: QueryParams) =>
    [...surveysKeys.all, 'responses', id, params] as const,
}
