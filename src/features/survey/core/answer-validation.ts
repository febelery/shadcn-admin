import { z } from 'zod'
import type { QuestionElement } from './types'

export type AnswerValidationIssue = {
  code: 'required' | 'invalid_answer'
  path: (string | number)[]
  message: string
}

export type AnswerValidationResult = {
  valid: boolean
  issues: AnswerValidationIssue[]
}

export type AnswerValidationContext = {
  /** 隐藏题不参与当前提交的答案校验。 */
  visible: boolean
}

function validResult(): AnswerValidationResult {
  return { valid: true, issues: [] }
}

export function isAnswerEmpty(answer: unknown): boolean {
  if (answer === undefined || answer === null) return true
  if (typeof answer === 'string') return answer.trim().length === 0
  if (Array.isArray(answer)) return answer.length === 0
  if (isPlainRecord(answer)) return Object.keys(answer).length === 0
  return false
}

export function validateQuestionAnswer(
  question: QuestionElement,
  answer: unknown,
  context: AnswerValidationContext
): AnswerValidationResult {
  if (!context.visible) return validResult()

  if (isAnswerEmpty(answer)) {
    return question.required
      ? {
          valid: false,
          issues: [
            {
              code: 'required',
              path: [],
              message: '此题为必填题',
            },
          ],
        }
      : validResult()
  }

  const parsed = answerSchema(question).safeParse(answer)
  if (parsed.success) return validResult()

  return {
    valid: false,
    issues: parsed.error.issues.map((issue) => ({
      code: 'invalid_answer',
      path: issue.path.map((segment) =>
        typeof segment === 'number' ? segment : String(segment)
      ),
      message:
        issue.code === 'unrecognized_keys'
          ? '答案包含不存在的项目'
          : issue.message,
    })),
  }
}

function answerSchema(question: QuestionElement): z.ZodType {
  switch (question.type) {
    case 'single_choice':
    case 'dropdown':
      return optionIdSchema(question.config.options)

    case 'multiple_choice': {
      let schema = uniqueIdsSchema(optionIdSchema(question.config.options))
      if (question.config.minSelect !== undefined) {
        schema = schema.min(
          question.config.minSelect,
          `至少选择 ${question.config.minSelect} 项`
        )
      }
      if (question.config.maxSelect !== undefined) {
        schema = schema.max(
          question.config.maxSelect,
          `最多选择 ${question.config.maxSelect} 项`
        )
      }
      return schema
    }

    case 'ranking':
      return uniqueIdsSchema(optionIdSchema(question.config.options)).length(
        question.config.options.length,
        '排序答案必须包含全部选项'
      )

    case 'matrix_single':
      return identityRecordSchema(
        question.config.rows.map((row) => row.id),
        optionIdSchema(question.config.columns),
        question.required
      )

    case 'matrix_multiple':
      return identityRecordSchema(
        question.config.rows.map((row) => row.id),
        uniqueIdsSchema(optionIdSchema(question.config.columns)).min(
          1,
          '每行至少选择一项'
        ),
        question.required
      )

    case 'cascader':
      return cascaderPathSchema(question.config.cascaderOptions)

    case 'text':
    case 'textarea':
    case 'phone':
      return textAnswerSchema(question.config)

    case 'email':
      return textAnswerSchema(question.config, 'email')

    case 'url':
      return textAnswerSchema(question.config, 'url')

    case 'number':
      return numberAnswerSchema({
        min: question.config.minValue,
        max: question.config.maxValue,
        step: question.config.step,
      })

    case 'date':
      return dateAnswerSchema(question.config.minDate, question.config.maxDate)

    case 'date_range': {
      const date = dateAnswerSchema(
        question.config.minDate,
        question.config.maxDate
      )
      return z
        .object({ start: date, end: date })
        .strict()
        .refine((range) => range.start <= range.end, {
          path: ['end'],
          message: '结束日期不能早于开始日期',
        })
    }

    case 'rating':
      return z
        .number()
        .int('评分必须是整数')
        .min(1, '评分不能小于 1')
        .max(question.config.starCount, '评分不能超过星级上限')

    case 'slider':
      return numberAnswerSchema({
        min: question.config.minValue,
        max: question.config.maxValue,
        step: question.config.step,
      })

    case 'nps':
      return z
        .number()
        .int('NPS 必须是整数')
        .min(0, 'NPS 不能小于 0')
        .max(10, 'NPS 不能大于 10')

    case 'likert':
      return identityRecordSchema(
        question.config.statements.map((statement) => statement.id),
        z
          .number()
          .int('量表分值必须是整数')
          .min(question.config.scaleMin, '分值低于量表下限')
          .max(question.config.scaleMax, '分值超过量表上限'),
        question.required
      )
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

function optionIdSchema(options: { id: string }[]) {
  const ids = new Set(options.map((option) => option.id))
  return z
    .string('选项 ID 必须是字符串')
    .min(1, '选项 ID 不能为空')
    .refine((id) => ids.has(id), '答案引用了不存在的选项')
}

function uniqueIdsSchema(itemSchema: z.ZodType<string>) {
  return z.array(itemSchema).superRefine((ids, context) => {
    const seen = new Set<string>()
    ids.forEach((id, index) => {
      if (seen.has(id)) {
        context.addIssue({
          code: 'custom',
          path: [index],
          message: '答案不能包含重复选项',
        })
      }
      seen.add(id)
    })
  })
}

function identityRecordSchema(
  ids: string[],
  valueSchema: z.ZodType,
  requireEveryIdentity: boolean
) {
  const allowedIds = new Set(ids)
  return z.record(z.string(), valueSchema).superRefine((answer, context) => {
    for (const id of Object.keys(answer)) {
      if (!allowedIds.has(id)) {
        context.addIssue({
          code: 'custom',
          path: [id],
          message: '答案引用了不存在的项目',
        })
      }
    }

    if (!requireEveryIdentity) return
    for (const id of ids) {
      if (!(id in answer)) {
        context.addIssue({
          code: 'custom',
          path: [id],
          message: '必填题必须回答每一项',
        })
      }
    }
  })
}

function cascaderPathSchema(
  roots: NonNullable<QuestionElement['config']['cascaderOptions']>
) {
  return z
    .array(z.string().min(1, '级联节点 ID 不能为空'))
    .min(1, '至少选择一个级联节点')
    .superRefine((path, context) => {
      let level = roots
      let selected: (typeof roots)[number] | undefined

      for (let index = 0; index < path.length; index += 1) {
        selected = level.find((node) => node.id === path[index])
        if (!selected) {
          context.addIssue({
            code: 'custom',
            path: [index],
            message: '级联路径不连续或节点不存在',
          })
          return
        }
        level = selected.children ?? []
      }

      if ((selected?.children?.length ?? 0) > 0) {
        context.addIssue({
          code: 'custom',
          path: [path.length - 1],
          message: '级联答案必须选择到末级节点',
        })
      }
    })
}

function textAnswerSchema(
  config: { minLength?: number; maxLength?: number },
  format?: 'email' | 'url'
) {
  return z.string().superRefine((value, context) => {
    if (config.minLength !== undefined && value.length < config.minLength) {
      context.addIssue({
        code: 'custom',
        message: `回答不能少于 ${config.minLength} 个字符`,
      })
    }
    if (config.maxLength !== undefined && value.length > config.maxLength) {
      context.addIssue({
        code: 'custom',
        message: `回答不能超过 ${config.maxLength} 个字符`,
      })
    }
    if (format === 'email' && !z.email().safeParse(value).success) {
      context.addIssue({ code: 'custom', message: '请输入有效的邮箱地址' })
    }
    if (
      format === 'url' &&
      !z.url({ protocol: /^https?$/ }).safeParse(value).success
    ) {
      context.addIssue({ code: 'custom', message: '请输入有效的 HTTP(S) 网址' })
    }
  })
}

function numberAnswerSchema({
  min,
  max,
  step,
}: {
  min?: number
  max?: number
  step?: number
}) {
  return z
    .number()
    .finite('答案必须是有限数值')
    .superRefine((value, context) => {
      if (min !== undefined && value < min) {
        context.addIssue({ code: 'custom', message: `数值不能小于 ${min}` })
      }
      if (max !== undefined && value > max) {
        context.addIssue({ code: 'custom', message: `数值不能大于 ${max}` })
      }
      if (step !== undefined && !matchesStep(value, step, min ?? 0)) {
        context.addIssue({
          code: 'custom',
          message: `数值必须符合步长 ${step}`,
        })
      }
    })
}

function matchesStep(value: number, step: number, base: number) {
  const steps = (value - base) / step
  return Math.abs(steps - Math.round(steps)) < 1e-9
}

function dateAnswerSchema(min?: string, max?: string) {
  return z.iso.date().superRefine((value, context) => {
    if (min !== undefined && value < min) {
      context.addIssue({ code: 'custom', message: `日期不能早于 ${min}` })
    }
    if (max !== undefined && value > max) {
      context.addIssue({ code: 'custom', message: `日期不能晚于 ${max}` })
    }
  })
}
