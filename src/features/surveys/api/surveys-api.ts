import axios from 'axios'
import type { SurveyListItem } from '../types'

export interface SurveysResponse {
  data: SurveyListItem[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export const surveysApi = {
  list: async (params: any = {}): Promise<SurveysResponse> => {
    const res = await axios.get<SurveysResponse>('/api/surveys', { params })
    return res.data
  },

  create: async (title: string): Promise<{ id: string }> => {
    const res = await axios.post<{ id: string }>('/api/surveys', { title })
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`/api/surveys/${id}`)
  },

  updateStatus: async (id: string, status: string): Promise<void> => {
    await axios.patch(`/api/surveys/${id}/status`, { status })
  },
}
