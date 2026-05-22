import axios from 'axios'
import type { PaginatedResponse, QueryParams } from '@/types/api'
import type {
  SurveyListItem,
  SurveyRecordItem,
  SurveySchema,
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
  record: (id: string) => `/api/survey/${id}/record`,
  export: (id: string) => `/api/survey/${id}/record/export`,
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

/** 获取问卷答题/填写记录 */
export async function listSurveyRecord(
  id: string,
  params?: QueryParams
): Promise<PaginatedResponse<SurveyRecordItem>> {
  const { data } = await axios.get(SURVEY_API.record(id), { params })
  return data
}

/** 导出问卷答题记录为 Excel */
export async function exportSurveyRecordExcel(id: string): Promise<Blob> {
  const { data } = await axios.get(SURVEY_API.export(id), {
    params: { format: 'xlsx' },
    responseType: 'blob',
  })
  return data
}
