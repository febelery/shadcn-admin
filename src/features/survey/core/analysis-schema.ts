import { z } from 'zod'
import { CONDITION_OPERATORS } from './logic/operators'

const countSchema = z.number().int().nonnegative()
const percentageSchema = z.number().min(0).max(1)

const paginationMetaSchema = z
  .object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: countSchema,
    totalPages: countSchema,
  })
  .strict()

const baseQuestionAnalysisShape = {
  questionId: z.string().min(1),
  title: z.string(),
}

const choiceOptionAnalysisSchema = z
  .object({
    optionId: z.string().min(1),
    label: z.string(),
    count: countSchema,
    percentage: percentageSchema,
  })
  .strict()

const choiceAnalysisSchema = z
  .object({
    ...baseQuestionAnalysisShape,
    type: z.enum(['single_choice', 'multiple_choice', 'dropdown']),
    options: z.array(choiceOptionAnalysisSchema),
  })
  .strict()

const rankingOptionAnalysisSchema = z
  .object({
    optionId: z.string().min(1),
    label: z.string(),
    firstChoiceCount: countSchema,
    firstChoicePercentage: percentageSchema,
    averageRank: z.number().positive().nullable(),
  })
  .strict()

const rankingAnalysisSchema = z
  .object({
    ...baseQuestionAnalysisShape,
    type: z.literal('ranking'),
    options: z.array(rankingOptionAnalysisSchema),
  })
  .strict()

const cascaderPathAnalysisSchema = z
  .object({
    pathIds: z.array(z.string().min(1)).min(1),
    label: z.string(),
    count: countSchema,
    percentage: percentageSchema,
  })
  .strict()

const cascaderAnalysisSchema = z
  .object({
    ...baseQuestionAnalysisShape,
    type: z.literal('cascader'),
    paths: z.array(cascaderPathAnalysisSchema),
  })
  .strict()

const scoreDistributionSchema = z
  .object({
    score: z.union([z.number(), z.string()]),
    count: countSchema,
    percentage: percentageSchema,
  })
  .strict()

const numericAnalysisShape = {
  ...baseQuestionAnalysisShape,
  avgScore: z.number(),
  medianScore: z.number(),
  minScore: z.number(),
  maxScore: z.number(),
  sumScore: z.number(),
  distribution: z.array(scoreDistributionSchema),
}

const scoreAnalysisSchema = z
  .object({
    ...numericAnalysisShape,
    type: z.enum(['rating', 'slider', 'number']),
  })
  .strict()

const npsAnalysisSchema = z
  .object({
    ...numericAnalysisShape,
    type: z.literal('nps'),
    npsScore: z.number().int().min(-100).max(100),
    promoters: countSchema,
    passives: countSchema,
    detractors: countSchema,
  })
  .strict()

const matrixColumnValueAnalysisSchema = z
  .object({
    columnId: z.string().min(1),
    columnLabel: z.string(),
    count: countSchema,
    percentage: percentageSchema,
  })
  .strict()

const matrixRowAnalysisSchema = z
  .object({
    rowId: z.string().min(1),
    rowLabel: z.string(),
    columns: z.array(matrixColumnValueAnalysisSchema),
  })
  .strict()

const matrixAnalysisSchema = z
  .object({
    ...baseQuestionAnalysisShape,
    type: z.enum(['matrix_single', 'matrix_multiple']),
    rows: z.array(matrixRowAnalysisSchema),
  })
  .strict()

const likertStatementValueAnalysisSchema = z
  .object({
    score: z.number(),
    count: countSchema,
    percentage: percentageSchema,
  })
  .strict()

const likertStatementAnalysisSchema = z
  .object({
    statementId: z.string().min(1),
    statementLabel: z.string(),
    distribution: z.array(likertStatementValueAnalysisSchema),
  })
  .strict()

const likertAnalysisSchema = z
  .object({
    ...baseQuestionAnalysisShape,
    type: z.literal('likert'),
    statements: z.array(likertStatementAnalysisSchema),
  })
  .strict()

const textAnswerItemSchema = z
  .object({
    id: z.string().min(1),
    text: z.string(),
    respondent: z.string().optional(),
    completedAt: z.iso.datetime().optional(),
  })
  .strict()

const textAnalysisSchema = z
  .object({
    ...baseQuestionAnalysisShape,
    type: z.enum([
      'text',
      'textarea',
      'email',
      'phone',
      'url',
      'date',
      'date_range',
    ]),
    answers: z
      .object({
        data: z.array(textAnswerItemSchema),
        meta: paginationMetaSchema,
      })
      .strict(),
  })
  .strict()

const questionAnalysisSchema = z.discriminatedUnion('type', [
  choiceAnalysisSchema,
  rankingAnalysisSchema,
  cascaderAnalysisSchema,
  scoreAnalysisSchema,
  npsAnalysisSchema,
  matrixAnalysisSchema,
  likertAnalysisSchema,
  textAnalysisSchema,
])

const surveyAnalysisSchema = z
  .object({
    surveyId: z.string().min(1),
    overview: z
      .object({
        totalRecords: countSchema,
        completeRecords: countSchema,
        partialRecords: countSchema,
        avgDurationMs: countSchema,
        dailyTrend: z.array(
          z.object({ date: z.iso.date(), count: countSchema }).strict()
        ),
      })
      .strict(),
  })
  .strict()

const segmentConditionOperatorSchema = z.enum(CONDITION_OPERATORS)

const segmentConditionSchema = z
  .object({
    questionId: z.string(),
    operator: segmentConditionOperatorSchema,
    value: z.union([z.string(), z.number()]).optional(),
    value2: z.union([z.string(), z.number()]).optional(),
  })
  .strict()

const segmentDefinitionSchema = z
  .object({
    id: z.string().min(1),
    label: z.string(),
    conditions: z.array(segmentConditionSchema),
  })
  .strict()

const surveySegmentAnalysisSchema = z
  .object({
    surveyId: z.string().min(1),
    metric: z.literal('count'),
    metricLabel: z.string(),
    total: countSchema,
    segments: z.array(
      z
        .object({
          id: z.string().min(1),
          label: z.string(),
          count: countSchema,
          percentage: percentageSchema,
          conditions: z.array(segmentConditionSchema),
        })
        .strict()
    ),
  })
  .strict()

export type SurveyAnalysisOverview = z.infer<
  typeof surveyAnalysisSchema
>['overview']
export type RankingAnalysis = z.infer<typeof rankingAnalysisSchema>
export type CascaderAnalysis = z.infer<typeof cascaderAnalysisSchema>
export type NumericAnalysis = z.infer<
  typeof scoreAnalysisSchema | typeof npsAnalysisSchema
>
export type MatrixAnalysis = z.infer<typeof matrixAnalysisSchema>
export type LikertAnalysis = z.infer<typeof likertAnalysisSchema>
export type TextAnswerItem = z.infer<typeof textAnswerItemSchema>
export type TextAnalysis = z.infer<typeof textAnalysisSchema>
export type QuestionAnalysis = z.infer<typeof questionAnalysisSchema>
export type SurveyAnalysisResult = z.infer<typeof surveyAnalysisSchema>
export type SegmentConditionOperator = z.infer<
  typeof segmentConditionOperatorSchema
>
export type SegmentCondition = z.infer<typeof segmentConditionSchema>
export type SegmentDefinition = z.infer<typeof segmentDefinitionSchema>
export type SurveySegmentAnalysisResult = z.infer<
  typeof surveySegmentAnalysisSchema
>

export function parseSurveyAnalysis(data: unknown): SurveyAnalysisResult {
  return surveyAnalysisSchema.parse(data)
}

export function parseQuestionAnalysis(data: unknown): QuestionAnalysis {
  return questionAnalysisSchema.parse(data)
}

export function parseSurveySegmentAnalysis(
  data: unknown
): SurveySegmentAnalysisResult {
  return surveySegmentAnalysisSchema.parse(data)
}

export function parseSegmentDefinitions(data: unknown): SegmentDefinition[] {
  return z.array(segmentDefinitionSchema).parse(data)
}
