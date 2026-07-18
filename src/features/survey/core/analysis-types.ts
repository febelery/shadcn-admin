import type { QuestionType } from './types'

export interface SurveyAnalysisOverview {
  totalRecords: number
  completeRecords: number
  partialRecords: number
  avgDurationMs: number
  dailyTrend: { date: string; count: number }[]
}

export interface ChoiceOptionAnalysis {
  optionId: string
  label: string
  count: number
  percentage: number // 占比 (选择人数 / 本题答题人数，或对于多选为选择人数 / 总答卷人数)
}

export interface BaseQuestionAnalysis<Type extends QuestionType> {
  questionId: string
  title: string
  type: Type
}

type ChoiceAnalysisQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'dropdown'
  | 'ranking'
  | 'cascader'

type NumericAnalysisQuestionType = 'rating' | 'nps' | 'slider' | 'number'

type MatrixAnalysisQuestionType = 'matrix_single' | 'matrix_multiple'

type TextAnalysisQuestionType = Exclude<
  QuestionType,
  | ChoiceAnalysisQuestionType
  | NumericAnalysisQuestionType
  | MatrixAnalysisQuestionType
  | 'likert'
>

export interface ChoiceAnalysis extends BaseQuestionAnalysis<ChoiceAnalysisQuestionType> {
  options: ChoiceOptionAnalysis[]
}

export interface ScoreDistribution {
  score: number | string
  count: number
  percentage: number
}

export interface NumericAnalysis extends BaseQuestionAnalysis<NumericAnalysisQuestionType> {
  avgScore?: number
  medianScore?: number
  minScore?: number
  maxScore?: number
  sumScore?: number
  distribution: ScoreDistribution[]
  // NPS 专属属性
  npsScore?: number
  promoters?: number
  passives?: number
  detractors?: number
}

export interface MatrixColumnValueAnalysis {
  columnId: string
  columnLabel: string
  count: number
  percentage: number
}

export interface MatrixRowAnalysis {
  rowId: string
  rowLabel: string
  columns: MatrixColumnValueAnalysis[]
}

export interface MatrixAnalysis extends BaseQuestionAnalysis<MatrixAnalysisQuestionType> {
  rows: MatrixRowAnalysis[]
}

export interface LikertStatementValueAnalysis {
  score: number
  count: number
  percentage: number
}

export interface LikertStatementAnalysis {
  statementId: string
  statementLabel: string
  distribution: LikertStatementValueAnalysis[]
}

export interface LikertAnalysis extends BaseQuestionAnalysis<'likert'> {
  statements: LikertStatementAnalysis[]
}

export interface TextAnswerItem {
  id: string
  text: string
  respondent?: string
  completedAt?: string
}

export interface TextAnalysis extends BaseQuestionAnalysis<TextAnalysisQuestionType> {
  answers: {
    data: TextAnswerItem[]
    meta: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
  }
}

export type QuestionAnalysis =
  | ChoiceAnalysis
  | NumericAnalysis
  | MatrixAnalysis
  | LikertAnalysis
  | TextAnalysis

export interface SurveyAnalysisResult {
  surveyId: string
  overview: SurveyAnalysisOverview
}

export type AnalysisMetric = 'count'

export type SegmentConditionOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'not_contains'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'empty'
  | 'not_empty'

export interface SegmentCondition {
  questionId: string
  operator: SegmentConditionOperator
  value?: string | number
  value2?: string | number
}

export interface SegmentDefinition {
  id: string
  label: string
  conditions: SegmentCondition[]
}

export interface SegmentAnalysisItem {
  id: string
  label: string
  count: number
  percentage: number
  conditions: SegmentCondition[]
}

export interface SurveySegmentAnalysisResult {
  surveyId: string
  metric: AnalysisMetric
  metricLabel: string
  total: number
  segments: SegmentAnalysisItem[]
}
