import { z } from 'zod'
import { getDocumentIdentityIssues } from './document-identities'
import { SURVEY_DOCUMENT_SCHEMA_VERSION } from './document-version'
import { getQuestionConfigIssues } from './question-config'
import { parseRichTextContent } from './rich-text'
import { QUESTION_TYPES, type SurveyDocument } from './types'

const ruleActionTypeValues = [
  'show',
  'hide',
  'jump_to_question',
  'end',
] as const

const ruleActionSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(ruleActionTypeValues),
    target: z.string().optional(),
  })
  .strict()

const ruleConditionSchema = z.union([
  z
    .object({
      questionId: z.string().min(1),
      operator: z.enum(['empty', 'not_empty']),
    })
    .strict(),
  z
    .object({
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
    })
    .strict(),
])

const questionElementSchema = z
  .object({
    kind: z.literal('question'),
    id: z.string().min(1),
    type: z.enum(QUESTION_TYPES),
    title: z.string(),
    description: z.string().optional(),
    required: z.boolean(),
    numbering: z
      .object({
        show: z.boolean().optional(),
      })
      .optional(),
    config: z.unknown(),
  })
  .strict()
  .superRefine((question, context) => {
    for (const issue of getQuestionConfigIssues(
      question.type,
      question.config
    )) {
      context.addIssue({
        code: 'custom',
        path: ['config', ...issue.path],
        message: issue.message,
      })
    }

    if (
      question.type === 'dynamic_panel' &&
      question.config &&
      typeof question.config === 'object' &&
      'templateElements' in question.config &&
      Array.isArray(question.config.templateElements)
    ) {
      question.config.templateElements.forEach((element, index) => {
        const result = surveyElementSchema.safeParse(element)
        if (!result.success) {
          for (const issue of result.error.issues) {
            context.addIssue({
              code: 'custom',
              path: ['config', 'templateElements', index, ...issue.path],
              message: issue.message,
            })
          }
        }
      })
    }
  })

const surveyElementSchema: z.ZodType<unknown> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    questionElementSchema,
    z.object({ kind: z.literal('divider'), id: z.string().min(1) }).strict(),
    z
      .object({
        kind: z.literal('rich_text'),
        id: z.string().min(1),
        content: z.unknown(),
      })
      .strict()
      .superRefine((element, context) => {
        try {
          parseRichTextContent(element.content)
        } catch (error) {
          context.addIssue({
            code: 'custom',
            path: ['content'],
            message: error instanceof Error ? error.message : '富文本内容无效',
          })
        }
      }),
    z
      .object({
        kind: z.literal('panel'),
        id: z.string().min(1),
        title: z.string().optional(),
        collapsible: z.boolean().optional(),
        elements: z.array(surveyElementSchema),
      })
      .strict(),
  ])
)

const sectionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().optional(),
    description: z.string().optional(),
    elements: z.array(surveyElementSchema),
  })
  .strict()

const surveyDocumentSchema = z
  .object({
    id: z.string().min(1),
    schemaVersion: z.literal(SURVEY_DOCUMENT_SCHEMA_VERSION),
    revision: z.number().int().nonnegative(),
    status: z.enum(['draft', 'published', 'archived']),
    slug: z.string().optional(),
    publishedAt: z.string().optional(),
    meta: z
      .object({
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
      })
      .strict(),
    presentation: z.object({ type: z.literal('scroll') }).strict(),
    theme: z
      .object({
        primaryColor: z.string(),
        backgroundColor: z.string(),
        borderRadius: z.string(),
        fontFamily: z.string().optional(),
      })
      .strict(),
    variables: z.array(
      z
        .object({
          id: z.string().min(1),
          name: z.string(),
          type: z.enum(['string', 'number', 'boolean']),
          source: z.enum(['url', 'hidden', 'literal']),
          default: z.union([z.string(), z.number(), z.boolean()]).optional(),
        })
        .strict()
    ),
    sections: z.tuple([sectionSchema]),
    rules: z.array(
      z
        .object({
          id: z.string().min(1),
          name: z.string(),
          enabled: z.boolean(),
          priority: z.number(),
          condition: ruleConditionSchema,
          action: ruleActionSchema,
        })
        .strict()
    ),
    validators: z.array(
      z
        .object({
          id: z.string().min(1),
          fields: z.array(z.string()),
          rule: z.string(),
          message: z.string(),
        })
        .strict()
    ),
    submission: z
      .object({
        quota: z
          .object({
            enabled: z.boolean(),
            total: z.number().int().positive(),
          })
          .strict()
          .optional(),
        timeWindow: z
          .object({
            enabled: z.boolean(),
            startAt: z.string().optional(),
            endAt: z.string().optional(),
          })
          .strict()
          .optional(),
        rateLimit: z
          .object({
            enabled: z.boolean(),
            maxPerUser: z.number().int().nonnegative().optional(),
            maxPerUserPerDay: z.number().int().nonnegative().optional(),
            maxPerDay: z.number().int().nonnegative().optional(),
          })
          .strict()
          .optional(),
        oncePerDevice: z.boolean().optional(),
        oncePerUser: z.boolean().optional(),
        password: z.string().optional(),
      })
      .strict(),
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .superRefine((document, context) => {
    for (const issue of getDocumentIdentityIssues(document as SurveyDocument)) {
      context.addIssue({
        code: 'custom',
        path: issue.path,
        message: issue.message,
      })
    }
  })

export function parseSurveyDocument(data: unknown): SurveyDocument {
  return surveyDocumentSchema.parse(data) as SurveyDocument
}
