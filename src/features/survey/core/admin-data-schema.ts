import { z } from 'zod'

const paginationMetaSchema = z
  .object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict()

const surveyListItemSchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    description: z.string(),
    status: z.enum(['draft', 'published', 'archived']),
    questionCount: z.number().int().nonnegative(),
    recordCount: z.number().int().nonnegative(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    slug: z.string().optional(),
  })
  .strict()

const surveyRecordItemSchema = z
  .object({
    id: z.string().min(1),
    surveyId: z.string().min(1),
    respondent: z.string().optional(),
    status: z.enum(['partial', 'complete']),
    answers: z.record(z.string(), z.unknown()),
    startedAt: z.iso.datetime(),
    completedAt: z.iso.datetime().optional(),
    durationMs: z.number().int().nonnegative().optional(),
  })
  .strict()

const surveyListResponseSchema = z
  .object({
    data: z.array(surveyListItemSchema),
    meta: paginationMetaSchema,
  })
  .strict()

const surveyRecordResponseSchema = z
  .object({
    data: z.array(surveyRecordItemSchema),
    meta: paginationMetaSchema,
  })
  .strict()

export type SurveyListItem = z.infer<typeof surveyListItemSchema>
export type SurveyRecordItem = z.infer<typeof surveyRecordItemSchema>
export type SurveyListResponse = z.infer<typeof surveyListResponseSchema>
export type SurveyRecordResponse = z.infer<typeof surveyRecordResponseSchema>

export function parseSurveyListResponse(data: unknown): SurveyListResponse {
  return surveyListResponseSchema.parse(data)
}

export function parseSurveyRecordResponse(data: unknown): SurveyRecordResponse {
  return surveyRecordResponseSchema.parse(data)
}
