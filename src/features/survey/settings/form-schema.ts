import { z } from 'zod'
import { zEditorString } from '@/components/editor'
import {
  CONSENT_CLAUSE_LIMIT,
  CONSENT_DEFAULT_READ_SECONDS,
  CONSENT_READ_SECONDS_LIMIT,
  getConsentTextLength,
} from '../core/consent'
import type {
  SurveyDefaultNumberingStyle,
  SurveyDocument,
  QuestionNumberingMode,
  ConsentClause,
  ConsentPolicy,
} from '../core/types'

const optionalPositiveInteger = z
  .string()
  .refine(
    (value) => value === '' || /^[1-9]\d*$/.test(value),
    '请输入正整数，留空表示不限制'
  )

const imageLocation = z.string().trim().max(2048, '链接不能超过 2048 个字符')

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i, '请输入十六进制颜色值')

const consentReadSeconds = z.string().refine((value) => {
  if (value === '') return true
  return (
    /^\d+$/.test(value) &&
    Number(value) >= 1 &&
    Number(value) <= CONSENT_READ_SECONDS_LIMIT
  )
}, `请输入 1-${CONSENT_READ_SECONDS_LIMIT} 的整数，留空表示不计时`)

const consentClauseFormSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  content: z.string(),
  optional: z.boolean(),
})

const surveySettingsFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, '请输入问卷标题')
      .max(120, '问卷标题不能超过 120 个字符'),
    description: zEditorString({
      max: 2000,
      maxError: '问卷描述不能超过 2000 个字符',
    }),
    cover: imageLocation,
    submitLabel: z
      .string()
      .trim()
      .min(1, '请输入提交按钮文案')
      .max(30, '提交按钮文案不能超过 30 个字符'),
    opensAt: z.date().optional(),
    closesAt: z.date().optional(),
    endTitle: z
      .string()
      .trim()
      .min(1, '请输入结束页标题')
      .max(120, '结束页标题不能超过 120 个字符'),
    endDescription: zEditorString({
      max: 2000,
      maxError: '结束页说明不能超过 2000 个字符',
    }),
    totalLimit: optionalPositiveInteger,
    perUserLimit: optionalPositiveInteger,
    dailyPerUserLimit: optionalPositiveInteger,
    dailyLimit: optionalPositiveInteger,
    accessPassword: z.string().max(128, '访问密码不能超过 128 个字符'),
    consentEnabled: z.boolean(),
    consentClauses: z
      .array(consentClauseFormSchema)
      .max(CONSENT_CLAUSE_LIMIT, `协议条款不能超过 ${CONSENT_CLAUSE_LIMIT} 条`),
    consentReadSeconds,
    consentRequireScroll: z.boolean(),
    consentCheckboxLabel: z.string().max(60, '勾选文案不能超过 60 个字符'),
    consentDenyMessage: z.string().max(200, '提示文案不能超过 200 个字符'),
    numberingStyle: z.enum([
      'decimal',
      'chinese',
      'decimal_paren',
      'decimal_bracket',
      'letter_upper',
      'letter_lower',
      'roman_upper',
      'roman_lower',
      'none',
    ]),
    numberingMode: z.enum(['global', 'continuous']),
    primaryColor: hexColor,
  })
  .superRefine((values, context) => {
    if (
      values.opensAt &&
      values.closesAt &&
      values.opensAt.getTime() > values.closesAt.getTime()
    ) {
      context.addIssue({
        code: 'custom',
        path: ['closesAt'],
        message: '结束时间不能早于开始时间',
      })
    }

    if (values.cover && !isHttpUrl(values.cover)) {
      context.addIssue({
        code: 'custom',
        path: ['cover'],
        message: '请输入有效的 http 或 https 链接',
      })
    }

    if (values.consentEnabled) {
      if (values.consentClauses.length === 0) {
        context.addIssue({
          code: 'custom',
          path: ['consentClauses'],
          message: '协议至少需要一条条款',
        })
      }

      for (const [index, clause] of values.consentClauses.entries()) {
        if (!clause.title.trim()) {
          context.addIssue({
            code: 'custom',
            path: ['consentClauses', index, 'title'],
            message: '请填写条款名称',
          })
        }
        if (getConsentTextLength(clause.content) === 0) {
          context.addIssue({
            code: 'custom',
            path: ['consentClauses', index, 'content'],
            message: '条款正文不能为空',
          })
        }
      }
    }
  })

export type SurveySettingsFormValues = z.infer<typeof surveySettingsFormSchema>

export { surveySettingsFormSchema }

function toDate(value?: string) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function normalizeHexColor(value: string) {
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value
      .slice(1)
      .split('')
      .map((character) => `${character}${character}`)
      .join('')}`
  }
  return value
}

export function documentToSurveySettingsValues(
  document: SurveyDocument
): SurveySettingsFormValues {
  return {
    title: document.meta.title,
    description: document.meta.description,
    cover: document.meta.cover ?? '',
    submitLabel: document.meta.submitLabel,
    opensAt: toDate(document.submissionPolicy.opensAt),
    closesAt: toDate(document.submissionPolicy.closesAt),
    endTitle: document.meta.endTitle,
    endDescription: document.meta.endDescription,
    totalLimit: document.submissionPolicy.totalLimit?.toString() ?? '',
    perUserLimit: document.submissionPolicy.perUserLimit?.toString() ?? '',
    dailyPerUserLimit:
      document.submissionPolicy.dailyPerUserLimit?.toString() ?? '',
    dailyLimit: document.submissionPolicy.dailyLimit?.toString() ?? '',
    accessPassword: document.submissionPolicy.accessPassword ?? '',
    consentEnabled: Boolean(document.submissionPolicy.consent),
    consentClauses: (document.submissionPolicy.consent?.clauses ?? []).map(
      (clause) => ({
        id: clause.id,
        title: clause.title,
        content: clause.content,
        optional: clause.optional === true,
      })
    ),
    consentReadSeconds: document.submissionPolicy.consent
      ? (document.submissionPolicy.consent.minReadSeconds?.toString() ?? '')
      : CONSENT_DEFAULT_READ_SECONDS.toString(),
    consentRequireScroll:
      document.submissionPolicy.consent?.requireScrollToEnd === true,
    consentCheckboxLabel:
      document.submissionPolicy.consent?.checkboxLabel ?? '',
    consentDenyMessage: document.submissionPolicy.consent?.denyMessage ?? '',
    numberingStyle: document.meta.defaultQuestionNumbering ?? 'decimal',
    numberingMode: document.meta.questionNumberingMode ?? 'global',
    primaryColor: normalizeHexColor(document.theme.primaryColor),
  }
}

function optionalNumber(value: string) {
  return value ? Number(value) : undefined
}

function buildConsentPolicy(
  values: SurveySettingsFormValues
): ConsentPolicy | undefined {
  if (!values.consentEnabled) return undefined

  const clauses: ConsentClause[] = values.consentClauses.map((clause) => {
    const next: ConsentClause = {
      id: clause.id,
      title: clause.title.trim(),
      content: clause.content,
    }
    if (clause.optional) next.optional = true
    return next
  })

  const checkboxLabel = values.consentCheckboxLabel.trim()
  const denyMessage = values.consentDenyMessage.trim()
  const readSeconds = Number(values.consentReadSeconds)

  const consent: ConsentPolicy = { clauses }
  if (readSeconds >= 1) consent.minReadSeconds = readSeconds
  if (values.consentRequireScroll) consent.requireScrollToEnd = true
  if (checkboxLabel) consent.checkboxLabel = checkboxLabel
  if (denyMessage) consent.denyMessage = denyMessage
  return consent
}

export function applySurveySettingsValues(
  document: SurveyDocument,
  values: SurveySettingsFormValues
): SurveyDocument {
  const next: SurveyDocument = {
    ...document,
    meta: {
      ...document.meta,
      title: values.title,
      description: values.description,
      cover: values.cover || undefined,
      submitLabel: values.submitLabel,
      endTitle: values.endTitle,
      endDescription: values.endDescription,
      defaultQuestionNumbering:
        values.numberingStyle as SurveyDefaultNumberingStyle,
      questionNumberingMode: values.numberingMode as QuestionNumberingMode,
    },
    theme: {
      ...document.theme,
      primaryColor: values.primaryColor,
    },
    submissionPolicy: {
      ...document.submissionPolicy,
      opensAt: values.opensAt?.toISOString(),
      closesAt: values.closesAt?.toISOString(),
      totalLimit: optionalNumber(values.totalLimit),
      perUserLimit: optionalNumber(values.perUserLimit),
      dailyPerUserLimit: optionalNumber(values.dailyPerUserLimit),
      dailyLimit: optionalNumber(values.dailyLimit),
      accessPassword: values.accessPassword || undefined,
      consent: buildConsentPolicy(values),
    },
  }

  for (const key of Object.keys(next.submissionPolicy) as Array<
    keyof SurveyDocument['submissionPolicy']
  >) {
    if (next.submissionPolicy[key] === undefined) {
      delete next.submissionPolicy[key]
    }
  }

  return next
}
