import axios from 'axios'
import type { PaginatedResponse, QueryParams } from '@/types/api'
import type {
  SurveyListItem,
  SurveyResponseItem,
  SurveySchema,
  SurveyStats,
} from '@/features/surveys/core/types'

/** 管理端 API 路径（复数资源名） */
export const SURVEYS_API = {
  list: '/api/surveys',
  create: '/api/surveys',
  detail: (id: string) => `/api/surveys/${id}`,
  update: (id: string) => `/api/surveys/${id}`,
  delete: (id: string) => `/api/surveys/${id}`,
  status: (id: string) => `/api/surveys/${id}/status`,
  publish: (id: string) => `/api/surveys/${id}/publish`,
  stats: (id: string) => `/api/surveys/${id}/stats`,
  responses: (id: string) => `/api/surveys/${id}/responses`,
  export: (id: string) => `/api/surveys/${id}/responses/export`,
} as const

export async function listSurveys(
  params?: QueryParams
): Promise<PaginatedResponse<SurveyListItem>> {
  const { data } = await axios.get(SURVEYS_API.list, { params })
  return data
}

export async function createSurvey(title: string): Promise<{ id: string }> {
  const { data } = await axios.post(SURVEYS_API.create, { title })
  return data
}

export async function getSurveyDetail(id: string): Promise<SurveySchema> {
  const { data } = await axios.get(SURVEYS_API.detail(id))
  return data
}

export async function updateSurvey(id: string, schema: SurveySchema) {
  await axios.put(SURVEYS_API.update(id), schema)
}

export async function deleteSurvey(id: string) {
  await axios.delete(SURVEYS_API.delete(id))
}

export async function updateSurveyStatus(
  id: string,
  status: SurveySchema['status']
) {
  await axios.patch(SURVEYS_API.status(id), { status })
}

export async function publishSurvey(id: string) {
  const { data } = await axios.post<{
    slug: string
    version: string
    publishedAt: string
  }>(SURVEYS_API.publish(id))
  return data
}

export async function getSurveyStats(id: string): Promise<SurveyStats> {
  const { data } = await axios.get(SURVEYS_API.stats(id))
  return data
}

export async function listSurveyResponses(
  id: string,
  params?: QueryParams
): Promise<PaginatedResponse<SurveyResponseItem>> {
  const { data } = await axios.get(SURVEYS_API.responses(id), { params })
  return data
}

export async function exportSurveyResponsesExcel(id: string): Promise<Blob> {
  const { data } = await axios.get(SURVEYS_API.export(id), {
    params: { format: 'xlsx' },
    responseType: 'blob',
  })
  return data
}
