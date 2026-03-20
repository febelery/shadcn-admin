export type SurveyStatus = 'draft' | 'published' | 'archived'
export type SurveyMode = 'scroll' | 'card'

export interface SurveyListItem {
  id: string
  title: string
  description: string
  status: SurveyStatus
  mode: SurveyMode
  questionCount: number
  responseCount: number
  createdAt: string
  updatedAt: string
  startTime?: string
  endTime?: string
}
