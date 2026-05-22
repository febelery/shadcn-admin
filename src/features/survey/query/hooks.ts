import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PaginatedResponse, QueryParams } from '@/types/api'
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
  getSurveyAnalysis,
  getSurveyQuestionAnalysis,
  getSurveySegmentAnalysis,
} from '@/api/survey'
import type { SurveyRecordItem, SurveySchema } from '../core/types'
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

async function listAllSurveyRecords(surveyId: string) {
  const pageSize = 1000
  const firstPage = await listSurveyRecord(surveyId, { page: 1, pageSize })
  if (firstPage.meta.totalPages <= 1) {
    return firstPage
  }

  const records = [...firstPage.data]
  for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
    const pageResult = await listSurveyRecord(surveyId, { page, pageSize })
    records.push(...pageResult.data)
  }

  return {
    data: records,
    meta: {
      ...firstPage.meta,
      page: 1,
      pageSize: records.length,
      totalPages: 1,
    },
  } satisfies PaginatedResponse<SurveyRecordItem>
}

/** 获取问卷全部填写记录的 query hook */
export function useSurveyAllRecords(surveyId: string) {
  return useQuery({
    queryKey: surveyKeys.recordAll(surveyId),
    queryFn: () => listAllSurveyRecords(surveyId),
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

/** 获取问卷数据统计分析的 query hook */
export function useSurveyAnalysis(surveyId: string, params?: QueryParams) {
  return useQuery({
    queryKey: surveyKeys.analysis(surveyId, params),
    queryFn: () => getSurveyAnalysis(surveyId, params),
    enabled: !!surveyId,
  })
}

/** 获取问卷条件统计的 query hook */
export function useSurveySegmentAnalysis(
  surveyId: string,
  params?: QueryParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: surveyKeys.segmentAnalysis(surveyId, params),
    queryFn: () => getSurveySegmentAnalysis(surveyId, params),
    enabled: options?.enabled !== false && !!surveyId,
  })
}

/** 获取问卷中单道题目的详细分析数据的 query hook */
export function useSurveyQuestionAnalysis(
  surveyId: string,
  questionId: string,
  params?: QueryParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: surveyKeys.questionAnalysis(surveyId, questionId, params),
    queryFn: () => getSurveyQuestionAnalysis(surveyId, questionId, params),
    enabled: options?.enabled !== false && !!surveyId && !!questionId,
  })
}
