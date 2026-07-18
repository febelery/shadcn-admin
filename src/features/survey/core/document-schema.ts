import { z } from 'zod'
import { getDocumentIdentityIssues } from './document-identities'
import { SURVEY_DOCUMENT_SCHEMA_VERSION } from './document-version'
import { getQuestionConfigIssues } from './question-config'
import { parseRichTextContent } from './rich-text'
import { QUESTION_TYPES, RULE_ACTION_TYPES, type SurveyDocument } from './types'

const ruleActionSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(RULE_ACTION_TYPES),
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
  })

const surveyElementSchema = z.discriminatedUnion('kind', [
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
])

const instantSchema = z.iso.datetime({ precision: 3 })

const submissionPolicySchema = z
  .object({
    totalLimit: z.number().int().positive().optional(),
    dailyLimit: z.number().int().positive().optional(),
    perUserLimit: z.number().int().positive().optional(),
    dailyPerUserLimit: z.number().int().positive().optional(),
    perDeviceLimit: z.number().int().positive().optional(),
    opensAt: instantSchema.optional(),
    closesAt: instantSchema.optional(),
    accessPassword: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((policy, context) => {
    if (
      policy.opensAt &&
      policy.closesAt &&
      Date.parse(policy.opensAt) > Date.parse(policy.closesAt)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['closesAt'],
        message: '结束时间不能早于开始时间',
      })
    }
  })

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
    theme: z
      .object({
        primaryColor: z.string(),
        backgroundColor: z.string(),
        borderRadius: z.string(),
        fontFamily: z.string().optional(),
      })
      .strict(),
    elements: z.array(surveyElementSchema),
    rules: z.array(
      z
        .object({
          id: z.string().min(1),
          name: z.string(),
          enabled: z.boolean(),
          condition: ruleConditionSchema,
          action: ruleActionSchema,
        })
        .strict()
    ),
    submissionPolicy: submissionPolicySchema,
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
