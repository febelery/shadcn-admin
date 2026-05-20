import { z } from 'zod'
import type { SurveySchema } from './types'

const questionElementSchema = z.object({
  kind: z.literal('question'),
  id: z.string(),
  type: z.string(),
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

const surveyElementSchema = z.discriminatedUnion('kind', [
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
    // panel 嵌套在编辑器中未完整支持，暂用宽松校验
    elements: z.array(z.unknown()),
  }),
])

const surveySchemaZod = z.object({
  id: z.string(),
  version: z.string(),
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
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      elements: z.array(surveyElementSchema),
    })
  ),
  rules: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      enabled: z.boolean(),
      priority: z.number(),
      when: z.string(),
      actions: z.array(
        z.object({
          id: z.string(),
          type: z.string(),
          target: z.string().optional(),
          value: z.unknown().optional(),
        })
      ),
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

export function validateSurveySchema(data: unknown): SurveySchema {
  return surveySchemaZod.parse(data) as SurveySchema
}
