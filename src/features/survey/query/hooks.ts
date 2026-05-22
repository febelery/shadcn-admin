import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/types/api'
import {
  createSurvey,
  deleteSurvey,
  exportSurveyResponseExcel,
  getSurveyDetail,
  getSurveyStats,
  listSurveyResponse,
  listSurvey,
  publishSurvey,
  updateSurvey,
  updateSurveyStatus,
} from '@/api/survey'
import type { SurveySchema } from '../core/types'
import { surveyKeys } from './keys'

export function useSurveyList(params?: QueryParams) {
  return useQuery({
    queryKey: surveyKeys.list(params),
    queryFn: () => listSurvey(params),
  })
}

export function useCreateSurvey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => createSurvey(title),
    onSuccess: () => qc.invalidateQueries({ queryKey: surveyKeys.lists() }),
  })
}

export function useDeleteSurvey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSurvey,
    onSuccess: () => qc.invalidateQueries({ queryKey: surveyKeys.lists() }),
  })
}

export function useUpdateSurveyStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: SurveySchema['status']
    }) => updateSurveyStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: surveyKeys.lists() }),
  })
}

export function usePublishSurvey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: publishSurvey,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: surveyKeys.lists() })
      qc.invalidateQueries({ queryKey: surveyKeys.detail(id) })
    },
  })
}

export function useSurveyDetail(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: surveyKeys.detail(id),
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
      qc.invalidateQueries({ queryKey: surveyKeys.detail(id) })
      qc.invalidateQueries({ queryKey: surveyKeys.lists() })
    },
  })
}

export function useSurveyStats(surveyId: string) {
  return useQuery({
    queryKey: surveyKeys.stats(surveyId),
    queryFn: () => getSurveyStats(surveyId),
    enabled: !!surveyId,
  })
}

export function useSurveyResponse(surveyId: string, params?: QueryParams) {
  return useQuery({
    queryKey: surveyKeys.response(surveyId, params),
    queryFn: () => listSurveyResponse(surveyId, params),
    enabled: !!surveyId,
  })
}

export function useExportSurveyExcel() {
  return useMutation({
    mutationFn: async (surveyId: string) => {
      const blob = await exportSurveyResponseExcel(surveyId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `survey-${surveyId}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    },
  })
}
