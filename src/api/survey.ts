import axios from 'axios'
import type { QueryParams } from '@/types/api'
import {
  parseSurveyListResponse,
  parseSurveyRecordResponse,
  type SurveyListResponse,
  type SurveyRecordResponse,
} from '@/features/survey/core/admin-data-schema'
import {
  parseQuestionAnalysis,
  parseSurveyAnalysis,
  parseSurveySegmentAnalysis,
  type QuestionAnalysis,
  type SurveyAnalysisResult,
  type SurveySegmentAnalysisResult,
} from '@/features/survey/core/analysis-schema'
import { parseSurveyDocument } from '@/features/survey/core/document-schema'
import type { SurveyDocument } from '@/features/survey/core/types'

/** 管理端 API 路径（单数资源名） */
export const SURVEY_API = {
  list: '/api/survey',
  create: '/api/survey',
  detail: (id: string) => `/api/survey/${id}`,
  update: (id: string) => `/api/survey/${id}`,
  delete: (id: string) => `/api/survey/${id}`,
  status: (id: string) => `/api/survey/${id}/status`,
  publish: (id: string) => `/api/survey/${id}/publish`,
  record: (id: string) => `/api/survey/${id}/record`,
  export: (id: string) => `/api/survey/${id}/record/export`,
  analysis: (id: string) => `/api/survey/${id}/analysis`,
  questionAnalysis: (id: string, questionId: string) =>
    `/api/survey/${id}/analysis/question/${questionId}`,
  segmentAnalysis: (id: string) => `/api/survey/${id}/analysis/segment`,
} as const

export async function listSurvey(
  params?: QueryParams
): Promise<SurveyListResponse> {
  const { data } = await axios.get(SURVEY_API.list, { params })
  return parseSurveyListResponse(data)
}

export async function createSurvey(
  document: SurveyDocument
): Promise<SurveyDocument> {
  const { data } = await axios.post(
    SURVEY_API.create,
    parseSurveyDocument(document)
  )
  return parseSurveyDocument(data)
}

export async function getSurveyDetail(id: string): Promise<SurveyDocument> {
  const { data } = await axios.get(SURVEY_API.detail(id))
  return parseSurveyDocument(data)
}

export async function updateSurvey(
  id: string,
  document: SurveyDocument
): Promise<SurveyDocument> {
  const { data } = await axios.put(
    SURVEY_API.update(id),
    parseSurveyDocument(document)
  )
  return parseSurveyDocument(data)
}

export async function deleteSurvey(id: string) {
  await axios.delete(SURVEY_API.delete(id))
}

export async function updateSurveyStatus(
  id: string,
  status: SurveyDocument['status']
) {
  await axios.patch(SURVEY_API.status(id), { status })
}

export async function publishSurvey(id: string): Promise<SurveyDocument> {
  const { data } = await axios.post(SURVEY_API.publish(id))
  return parseSurveyDocument(data)
}

/** 获取问卷答题/填写记录 */
export async function listSurveyRecord(
  id: string,
  params?: QueryParams
): Promise<SurveyRecordResponse> {
  const { data } = await axios.get(SURVEY_API.record(id), { params })
  return parseSurveyRecordResponse(data)
}

/** 导出问卷答题记录为 Excel */
export async function exportSurveyRecordExcel(id: string): Promise<Blob> {
  const { data } = await axios.get(SURVEY_API.export(id), {
    params: { format: 'xlsx' },
    responseType: 'blob',
  })
  return data
}

/** 获取问卷数据统计分析概览结果 */
export async function getSurveyAnalysis(
  id: string,
  params?: QueryParams
): Promise<SurveyAnalysisResult> {
  const { data } = await axios.get(SURVEY_API.analysis(id), { params })
  return parseSurveyAnalysis(data)
}

/** 获取问卷中单道题目的详细分析数据 */
export async function getSurveyQuestionAnalysis(
  id: string,
  questionId: string,
  params?: QueryParams
): Promise<QuestionAnalysis> {
  const { data } = await axios.get(
    SURVEY_API.questionAnalysis(id, questionId),
    { params }
  )
  return parseQuestionAnalysis(data)
}

/** 获取问卷条件统计结果 */
export async function getSurveySegmentAnalysis(
  id: string,
  params?: QueryParams
): Promise<SurveySegmentAnalysisResult> {
  const { data } = await axios.get(SURVEY_API.segmentAnalysis(id), { params })
  return parseSurveySegmentAnalysis(data)
}
