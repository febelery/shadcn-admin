import { z } from 'zod'
import type {
  QuestionConfig,
  QuestionConfigPatch,
  QuestionElement,
  QuestionType,
} from './types'

const QUESTION_TYPES_WITH_OPTIONS = new Set<QuestionType>([
  'single_choice',
  'multiple_choice',
  'dropdown',
  'ranking',
])

export function questionUsesOptions(type: QuestionType): boolean {
  return QUESTION_TYPES_WITH_OPTIONS.has(type)
}

const idLabelSchema = z
  .object({
    id: z.string().min(1),
    label: z.string(),
  })
  .strict()

const choiceOptionSchema = idLabelSchema.extend({
  isOther: z.boolean().optional(),
})

function uniqueIds<T extends { id: string }>(
  items: T[],
  context: z.RefinementCtx
) {
  const ids = new Set<string>()
  items.forEach((item, index) => {
    if (ids.has(item.id)) {
      context.addIssue({
        code: 'custom',
        path: [index, 'id'],
        message: 'ID 必须唯一',
      })
    }
    ids.add(item.id)
  })
}

const choiceOptionsSchema = z
  .array(choiceOptionSchema)
  .min(1, '至少保留一个选项')
  .superRefine((options, context) => {
    uniqueIds(options, context)
    if (options.filter((option) => option.isOther).length > 1) {
      context.addIssue({ code: 'custom', message: '只能有一个其他选项' })
    }
  })

const regularChoiceOptionsSchema = z
  .array(idLabelSchema)
  .min(1, '至少保留一个选项')
  .superRefine(uniqueIds)

const matrixItemsSchema = z
  .array(idLabelSchema)
  .min(1, '至少保留一项')
  .superRefine(uniqueIds)

type CascaderShape = {
  id: string
  label: string
  children?: CascaderShape[]
}

const cascaderNodeSchema: z.ZodType<CascaderShape> = z.lazy(() =>
  idLabelSchema.extend({ children: z.array(cascaderNodeSchema).optional() })
)

const cascaderOptionsSchema = z
  .array(cascaderNodeSchema)
  .min(1, '至少保留一个级联选项')
  .superRefine((nodes, context) => {
    const ids = new Set<string>()
    const visit = (items: CascaderShape[], path: PropertyKey[]) => {
      items.forEach((item, index) => {
        if (ids.has(item.id)) {
          context.addIssue({
            code: 'custom',
            path: [...path, index, 'id'],
            message: 'ID 必须唯一',
          })
        }
        ids.add(item.id)
        if (item.children) visit(item.children, [...path, index, 'children'])
      })
    }
    visit(nodes, [])
  })

const optionalLengthFields = {
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
}

const choiceFields = {
  options: choiceOptionsSchema,
  otherPlaceholder: z.string().optional(),
  randomizeOptions: z.boolean().optional(),
  optionLayout: z.enum(['vertical', 'horizontal']).optional(),
}

const textSchema = z
  .object({
    placeholder: z.string().optional(),
    ...optionalLengthFields,
  })
  .strict()
  .superRefine((config, context) => {
    if (
      config.minLength !== undefined &&
      config.maxLength !== undefined &&
      config.minLength > config.maxLength
    ) {
      context.addIssue({ code: 'custom', message: '最小字数不能大于最大字数' })
    }
  })

const numberRangeSchema = z
  .object({
    placeholder: z.string().optional(),
    minValue: z.number().finite().optional(),
    maxValue: z.number().finite().optional(),
    step: z.number().positive().optional(),
  })
  .strict()
  .superRefine((config, context) => {
    if (
      config.minValue !== undefined &&
      config.maxValue !== undefined &&
      config.minValue > config.maxValue
    ) {
      context.addIssue({ code: 'custom', message: '最小值不能大于最大值' })
    }
  })

const dateSchema = z
  .object({
    dateMode: z.enum(['date', 'datetime']).optional(),
    minDate: z.iso.date().optional(),
    maxDate: z.iso.date().optional(),
    placeholder: z.string().optional(),
  })
  .strict()
  .superRefine((config, context) => {
    if (config.minDate && config.maxDate && config.minDate > config.maxDate) {
      context.addIssue({ code: 'custom', message: '最早日期不能晚于最晚日期' })
    }
  })

const questionConfigSchemas = {
  single_choice: z.object(choiceFields).strict(),
  multiple_choice: z
    .object({
      ...choiceFields,
      minSelect: z.number().int().nonnegative().optional(),
      maxSelect: z.number().int().positive().optional(),
    })
    .strict()
    .superRefine((config, context) => {
      if (
        config.minSelect !== undefined &&
        config.maxSelect !== undefined &&
        config.minSelect > config.maxSelect
      ) {
        context.addIssue({
          code: 'custom',
          message: '最少选择数不能大于最多选择数',
        })
      }
      const available = config.options.length
      if (
        (config.minSelect ?? 0) > available ||
        (config.maxSelect ?? 0) > available
      ) {
        context.addIssue({ code: 'custom', message: '选择数量不能超过选项数' })
      }
    }),
  dropdown: z
    .object({
      options: regularChoiceOptionsSchema,
      randomizeOptions: z.boolean().optional(),
      placeholder: z.string().optional(),
    })
    .strict(),
  ranking: z
    .object({
      options: regularChoiceOptionsSchema,
      randomizeOptions: z.boolean().optional(),
    })
    .strict(),
  matrix_single: z
    .object({ rows: matrixItemsSchema, columns: matrixItemsSchema })
    .strict(),
  matrix_multiple: z
    .object({ rows: matrixItemsSchema, columns: matrixItemsSchema })
    .strict(),
  cascader: z
    .object({
      cascaderOptions: cascaderOptionsSchema,
      placeholder: z.string().optional(),
    })
    .strict(),
  text: textSchema,
  textarea: textSchema.safeExtend({
    textareaRows: z.number().int().min(2).max(20).optional(),
  }),
  number: numberRangeSchema,
  email: textSchema,
  phone: textSchema,
  url: textSchema,
  date: dateSchema,
  date_range: dateSchema,
  rating: z.object({ starCount: z.number().int().min(1).max(10) }).strict(),
  slider: z
    .object({
      minValue: z.number().finite(),
      maxValue: z.number().finite(),
      step: z.number().positive(),
    })
    .strict()
    .refine((config) => config.minValue < config.maxValue, {
      message: '最小值必须小于最大值',
    }),
  nps: z
    .object({
      npsLeftLabel: z.string().optional(),
      npsRightLabel: z.string().optional(),
    })
    .strict(),
  likert: z
    .object({
      statements: matrixItemsSchema,
      scaleMin: z.number().int(),
      scaleMax: z.number().int(),
    })
    .strict()
    .refine((config) => config.scaleMin < config.scaleMax, {
      message: '最小分值必须小于最大分值',
    }),
  file_upload: z
    .object({
      acceptTypes: z.array(z.string().min(1)).optional(),
      maxCount: z.number().int().positive(),
      maxSize: z.number().positive(),
    })
    .strict(),
} satisfies Record<QuestionType, z.ZodType>

function normalizeRange(
  config: Record<string, unknown>,
  patch: Record<string, unknown>,
  minKey: string,
  maxKey: string
) {
  const min = config[minKey]
  const max = config[maxKey]
  if (typeof min !== 'number' || typeof max !== 'number' || min <= max) return
  if (minKey in patch) config[maxKey] = min
  else config[minKey] = max
}

function normalizeConfigPatch(
  type: QuestionType,
  config: Record<string, unknown>,
  patch: Record<string, unknown>
) {
  normalizeRange(config, patch, 'minValue', 'maxValue')
  normalizeRange(config, patch, 'minLength', 'maxLength')
  normalizeRange(config, patch, 'minSelect', 'maxSelect')
  normalizeRange(config, patch, 'scaleMin', 'scaleMax')
  if (
    typeof config.minDate === 'string' &&
    typeof config.maxDate === 'string' &&
    config.minDate > config.maxDate
  ) {
    if ('minDate' in patch) config.maxDate = config.minDate
    else config.minDate = config.maxDate
  }

  if (typeof config.step === 'number' && config.step <= 0) config.step = 1
  if (
    type === 'slider' &&
    typeof config.minValue === 'number' &&
    typeof config.maxValue === 'number' &&
    config.minValue >= config.maxValue
  ) {
    const distance =
      typeof config.step === 'number' && config.step > 0 ? config.step : 1
    if ('minValue' in patch) config.maxValue = config.minValue + distance
    else config.minValue = config.maxValue - distance
  }
  if (
    type === 'likert' &&
    typeof config.scaleMin === 'number' &&
    typeof config.scaleMax === 'number' &&
    config.scaleMin >= config.scaleMax
  ) {
    if ('scaleMin' in patch) config.scaleMax = config.scaleMin + 1
    else config.scaleMin = config.scaleMax - 1
  }
  if (type === 'multiple_choice' && Array.isArray(config.options)) {
    const available = config.options.length
    if (typeof config.minSelect === 'number') {
      config.minSelect = Math.min(available, Math.max(0, config.minSelect))
    }
    if (typeof config.maxSelect === 'number') {
      config.maxSelect = Math.min(available, Math.max(1, config.maxSelect))
    }
    normalizeRange(config, patch, 'minSelect', 'maxSelect')
  }
  if (type === 'rating' && typeof config.starCount === 'number') {
    config.starCount = Math.min(10, Math.max(1, Math.round(config.starCount)))
  }
  if (type === 'textarea' && typeof config.textareaRows === 'number') {
    config.textareaRows = Math.min(
      20,
      Math.max(2, Math.round(config.textareaRows))
    )
  }
  if (type === 'file_upload') {
    if (typeof config.maxCount === 'number') {
      config.maxCount = Math.max(1, Math.round(config.maxCount))
    }
    if (typeof config.maxSize === 'number')
      config.maxSize = Math.max(1, config.maxSize)
  }
}

export function parseQuestionConfig<Type extends QuestionType>(
  type: Type,
  input: unknown
): QuestionConfig<Type> {
  return questionConfigSchemas[type].parse(input) as QuestionConfig<Type>
}

export function getQuestionConfigIssues(type: QuestionType, input: unknown) {
  const result = questionConfigSchemas[type].safeParse(input)
  if (result.success) return []
  return result.error.issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
  }))
}

export function applyQuestionConfigPatch(
  question: QuestionElement,
  patch: QuestionConfigPatch
): QuestionConfig {
  const next = { ...question.config, ...patch } as Record<string, unknown>
  normalizeConfigPatch(question.type, next, patch as Record<string, unknown>)
  return parseQuestionConfig(question.type, next)
}
