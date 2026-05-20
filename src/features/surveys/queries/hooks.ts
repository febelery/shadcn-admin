import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/types/api'
import type { SurveySchema } from '../core/types'
import {
  createSurvey,
  deleteSurvey,
  exportSurveyResponsesExcel,
  getSurveyDetail,
  getSurveyStats,
  listSurveyResponses,
  listSurveys,
  publishSurvey,
  updateSurvey,
  updateSurveyStatus,
} from '@/api/surveys'
import { surveysKeys } from './keys'

export function useSurveyList(params?: QueryParams) {
  return useQuery({
    queryKey: surveysKeys.list(params),
    queryFn: () => listSurveys(params),
  })
}

export function useCreateSurvey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => createSurvey(title),
    onSuccess: () => qc.invalidateQueries({ queryKey: surveysKeys.lists() }),
  })
}

export function useDeleteSurvey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSurvey,
    onSuccess: () => qc.invalidateQueries({ queryKey: surveysKeys.lists() }),
  })
}

export function useUpdateSurveyStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SurveySchema['status'] }) =>
      updateSurveyStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: surveysKeys.lists() }),
  })
}

export function usePublishSurvey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: publishSurvey,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: surveysKeys.lists() })
      qc.invalidateQueries({ queryKey: surveysKeys.detail(id) })
    },
  })
}

export function useSurveyDetail(
  id: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: surveysKeys.detail(id),
    queryFn: () => getSurveyDetail(id),
    enabled: options?.enabled !== false && !!id,
  })
}

export function useUpdateSurvey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SurveySchema }) =>
      updateSurvey(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: surveysKeys.detail(id) })
      qc.invalidateQueries({ queryKey: surveysKeys.lists() })
    },
  })
}

export function useSurveyStats(surveyId: string) {
  return useQuery({
    queryKey: surveysKeys.stats(surveyId),
    queryFn: () => getSurveyStats(surveyId),
    enabled: !!surveyId,
  })
}

export function useSurveyResponses(surveyId: string, params?: QueryParams) {
  return useQuery({
    queryKey: surveysKeys.responses(surveyId, params),
    queryFn: () => listSurveyResponses(surveyId, params),
    enabled: !!surveyId,
  })
}

export function useExportSurveyExcel() {
  return useMutation({
    mutationFn: async (surveyId: string) => {
      const blob = await exportSurveyResponsesExcel(surveyId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `surveys-${surveyId}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    },
  })
}
