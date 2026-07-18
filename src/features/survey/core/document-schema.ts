import { z } from 'zod'
import type { SurveySchema } from './types'

export const SURVEY_DOCUMENT_SCHEMA_VERSION = 1

const questionTypeValues = [
  'single_choice',
  'multiple_choice',
  'dropdown',
  'ranking',
  'matrix_single',
  'matrix_multiple',
  'cascader',
  'text',
  'textarea',
  'number',
  'email',
  'phone',
  'url',
  'date',
  'date_range',
  'fill_in',
  'rating',
  'slider',
  'nps',
  'likert',
  'dynamic_panel',
  'file_upload',
  'signature',
] as const

const ruleActionTypeValues = [
  'show',
  'hide',
  'jump_to_question',
  'end',
] as const

const ruleActionSchema = z.object({
  id: z.string(),
  type: z.enum(ruleActionTypeValues),
  target: z.string().optional(),
  value: z.unknown().optional(),
})

const ruleConditionSchema = z.union([
  z.object({
    questionId: z.string().min(1),
    operator: z.enum(['empty', 'not_empty']),
  }),
  z.object({
    questionId: z.string().min(1),
    operator: z.enum([
      'eq',
      'neq',
      'gt',
      'gte',
      'lt',
      'lte',
      'contains',
      'not_contains',
    ]),
    value: z.union([z.string(), z.number()]),
  }),
])

const questionElementSchema = z.object({
  kind: z.literal('question'),
  id: z.string(),
  type: z.enum(questionTypeValues),
  title: z.string(),
  description: z.string().optional(),
  required: z.boolean(),
  numbering: z
    .object({
      show: z.boolean().optional(),
    })
    .optional(),
  config: z.record(z.string(), z.unknown()),
})

const surveyElementSchema: z.ZodType<unknown> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    questionElementSchema,
    z.object({ kind: z.literal('divider'), id: z.string() }),
    z.object({
      kind: z.literal('html_block'),
      id: z.string(),
      html: z.string(),
    }),
    z.object({
      kind: z.literal('panel'),
      id: z.string(),
      title: z.string().optional(),
      collapsible: z.boolean().optional(),
      elements: z.array(surveyElementSchema),
    }),
  ])
)

const sectionSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  elements: z.array(surveyElementSchema),
})

const surveyDocumentSchema = z.object({
  id: z.string(),
  schemaVersion: z.literal(SURVEY_DOCUMENT_SCHEMA_VERSION),
  revision: z.number().int().nonnegative(),
  status: z.enum(['draft', 'published', 'archived']),
  slug: z.string().optional(),
  publishedAt: z.string().optional(),
  meta: z.object({
    title: z.string().min(1),
    description: z.string(),
    coverType: z.enum(['none', 'color', 'image']),
    coverColor: z.string().optional(),
    cover: z.string().optional(),
    submitLabel: z.string(),
    endTitle: z.string(),
    endDescription: z.string(),
    defaultQuestionNumbering: z
      .enum([
        'decimal',
        'chinese',
        'decimal_paren',
        'decimal_bracket',
        'letter_upper',
        'letter_lower',
        'roman_upper',
        'roman_lower',
        'none',
      ])
      .optional(),
    questionNumberingMode: z.enum(['global', 'continuous']).optional(),
  }),
  presentation: z.object({ type: z.literal('scroll') }),
  theme: z.object({
    primaryColor: z.string(),
    backgroundColor: z.string(),
    borderRadius: z.string(),
    fontFamily: z.string().optional(),
  }),
  variables: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['string', 'number', 'boolean']),
      source: z.enum(['url', 'hidden', 'literal']),
      default: z.union([z.string(), z.number(), z.boolean()]).optional(),
    })
  ),
  sections: z.tuple([sectionSchema]),
  rules: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      enabled: z.boolean(),
      priority: z.number(),
      condition: ruleConditionSchema,
      action: ruleActionSchema,
    })
  ),
  validators: z.array(
    z.object({
      id: z.string(),
      fields: z.array(z.string()),
      rule: z.string(),
      message: z.string(),
    })
  ),
  submission: z.record(z.string(), z.unknown()),
  extensions: z.record(z.string(), z.unknown()).optional(),
})

export function parseSurveyDocument(data: unknown): SurveySchema {
  return surveyDocumentSchema.parse(data) as SurveySchema
}
