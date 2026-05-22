import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/types/api'
import {
  createSurvey,
  deleteSurvey,
  exportSurveyRecordExcel,
  getSurveyDetail,
  listSurveyRecord,
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

/** 获取问卷填写记录的 query hook */
export function useSurveyRecord(surveyId: string, params?: QueryParams) {
  return useQuery({
    queryKey: surveyKeys.record(surveyId, params),
    queryFn: () => listSurveyRecord(surveyId, params),
    enabled: !!surveyId,
  })
}

/** 导出问卷填写记录的 mutation hook */
export function useExportSurveyRecordExcel() {
  return useMutation({
    mutationFn: async (surveyId: string) => {
      const blob = await exportSurveyRecordExcel(surveyId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `survey-${surveyId}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    },
  })
}
