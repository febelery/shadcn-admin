import axios from 'axios'
import type { PaginatedResponse, QueryParams } from '@/types/api'
import type {
  SurveyListItem,
  SurveyResponseItem,
  SurveySchema,
  SurveyStats,
} from '@/features/survey/core/types'

/** 管理端 API 路径（单数资源名） */
export const SURVEY_API = {
  list: '/api/survey',
  create: '/api/survey',
  detail: (id: string) => `/api/survey/${id}`,
  update: (id: string) => `/api/survey/${id}`,
  delete: (id: string) => `/api/survey/${id}`,
  status: (id: string) => `/api/survey/${id}/status`,
  publish: (id: string) => `/api/survey/${id}/publish`,
  stats: (id: string) => `/api/survey/${id}/stats`,
  response: (id: string) => `/api/survey/${id}/response`,
  export: (id: string) => `/api/survey/${id}/response/export`,
} as const

export async function listSurvey(
  params?: QueryParams
): Promise<PaginatedResponse<SurveyListItem>> {
  const { data } = await axios.get(SURVEY_API.list, { params })
  return data
}

export async function createSurvey(title: string): Promise<{ id: string }> {
  const { data } = await axios.post(SURVEY_API.create, { title })
  return data
}

export async function getSurveyDetail(id: string): Promise<SurveySchema> {
  const { data } = await axios.get(SURVEY_API.detail(id))
  return data
}

export async function updateSurvey(id: string, schema: SurveySchema) {
  await axios.put(SURVEY_API.update(id), schema)
}

export async function deleteSurvey(id: string) {
  await axios.delete(SURVEY_API.delete(id))
}

export async function updateSurveyStatus(
  id: string,
  status: SurveySchema['status']
) {
  await axios.patch(SURVEY_API.status(id), { status })
}

export async function publishSurvey(id: string) {
  const { data } = await axios.post<{
    slug: string
    version: string
    publishedAt: string
  }>(SURVEY_API.publish(id))
  return data
}

export async function getSurveyStats(id: string): Promise<SurveyStats> {
  const { data } = await axios.get(SURVEY_API.stats(id))
  return data
}

export async function listSurveyResponse(
  id: string,
  params?: QueryParams
): Promise<PaginatedResponse<SurveyResponseItem>> {
  const { data } = await axios.get(SURVEY_API.response(id), { params })
  return data
}

export async function exportSurveyResponseExcel(id: string): Promise<Blob> {
  const { data } = await axios.get(SURVEY_API.export(id), {
    params: { format: 'xlsx' },
    responseType: 'blob',
  })
  return data
}
