import axios from 'axios'
import type { SurveySchema } from './types'

export const surveyBuilderApi = {
  /**
   * 获取问卷完整 Schema 详情
   */
  getDetail: async (id: string): Promise<SurveySchema> => {
    const res = await axios.get<SurveySchema>(`/api/surveys/${id}`)
    return res.data
  },

  /**
   * 更新问卷数据
   */
  update: async (id: string, data: Partial<SurveySchema>): Promise<void> => {
    await axios.put(`/api/surveys/${id}`, data)
  },

  /**
   * 发布问卷
   */
  publish: async (id: string): Promise<void> => {
    await axios.post(`/api/surveys/${id}/publish`)
  },
}
