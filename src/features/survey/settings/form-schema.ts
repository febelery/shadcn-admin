import { z } from 'zod'
import { DEFAULT_META } from '../core/document-factory'
import type {
  CoverType,
  SurveyDefaultNumberingStyle,
  SurveyDocument,
  QuestionNumberingMode,
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

const surveySettingsFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, '请输入问卷标题')
      .max(120, '问卷标题不能超过 120 个字符'),
    description: z.string().max(2000, '问卷说明不能超过 2000 个字符'),
    coverType: z.enum(['none', 'color', 'image']),
    coverColor: hexColor,
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
    endDescription: z.string().max(2000, '结束页说明不能超过 2000 个字符'),
    totalLimit: optionalPositiveInteger,
    perUserLimit: optionalPositiveInteger,
    dailyPerUserLimit: optionalPositiveInteger,
    dailyLimit: optionalPositiveInteger,
    perDeviceLimit: optionalPositiveInteger,
    accessPassword: z.string().max(128, '访问密码不能超过 128 个字符'),
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

    if (values.coverType === 'image') {
      if (!values.cover) {
        context.addIssue({
          code: 'custom',
          path: ['cover'],
          message: '请选择头图或粘贴图片链接',
        })
      } else if (!isHttpUrl(values.cover)) {
        context.addIssue({
          code: 'custom',
          path: ['cover'],
          message: '请输入有效的 http 或 https 链接',
        })
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
    coverType: document.meta.coverType,
    coverColor: normalizeHexColor(
      document.meta.coverColor ?? DEFAULT_META.coverColor
    ),
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
    perDeviceLimit: document.submissionPolicy.perDeviceLimit?.toString() ?? '',
    accessPassword: document.submissionPolicy.accessPassword ?? '',
    numberingStyle: document.meta.defaultQuestionNumbering ?? 'decimal',
    numberingMode: document.meta.questionNumberingMode ?? 'global',
    primaryColor: normalizeHexColor(document.theme.primaryColor),
  }
}

function optionalNumber(value: string) {
  return value ? Number(value) : undefined
}

export function applySurveySettingsValues(
  document: SurveyDocument,
  values: SurveySettingsFormValues
): SurveyDocument {
  const next = structuredClone(document)
  next.meta = {
    ...next.meta,
    title: values.title,
    description: values.description,
    coverType: values.coverType as CoverType,
    coverColor: values.coverColor,
    cover: values.cover || undefined,
    submitLabel: values.submitLabel,
    endTitle: values.endTitle,
    endDescription: values.endDescription,
    defaultQuestionNumbering:
      values.numberingStyle as SurveyDefaultNumberingStyle,
    questionNumberingMode: values.numberingMode as QuestionNumberingMode,
  }
  next.theme = {
    ...next.theme,
    primaryColor: values.primaryColor,
  }
  next.submissionPolicy = {
    ...next.submissionPolicy,
    opensAt: values.opensAt?.toISOString(),
    closesAt: values.closesAt?.toISOString(),
    totalLimit: optionalNumber(values.totalLimit),
    perUserLimit: optionalNumber(values.perUserLimit),
    dailyPerUserLimit: optionalNumber(values.dailyPerUserLimit),
    dailyLimit: optionalNumber(values.dailyLimit),
    perDeviceLimit: optionalNumber(values.perDeviceLimit),
    accessPassword: values.accessPassword || undefined,
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
