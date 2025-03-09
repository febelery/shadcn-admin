import { z } from 'zod'

// 完整的 Zod 错误消息配置
export const zodErrorMessages = {
  errors: {
    invalid_type: '预期输入为{{expected}}，而输入为{{received}}',
    invalid_type_received_undefined: '必填',
    invalid_type_received_null: '必填',
    invalid_literal: '错误的字面量值，请输入 {{expected}}',
    unrecognized_keys: '对象中的键无法识别: {{- keys}}',
    invalid_union: '不满足联合类型中的选项',
    invalid_union_discriminator: '标识值无法被区分。请输入 {{- options}}',
    invalid_enum_value: "错误的枚举值 '{{received}}'。请输入 {{- options}}",
    invalid_arguments: '错误的函数参数格式',
    invalid_return_type: '错误的函数返回值格式',
    invalid_date: '错误的日期格式',
    custom: '错误的输入格式',
    invalid_intersection_types: '交叉类型结果无法被合并',
    not_multiple_of: '数值必须是 {{multipleOf}} 的倍数',
    not_finite: '数值必须有限',
    invalid_string: {
      email: '错误的{{validation}}格式',
      url: '错误的{{validation}}格式',
      uuid: '错误的{{validation}}格式',
      cuid: '错误的{{validation}}格式',
      regex: '错误的格式',
      datetime: '错误的{{validation}}格式',
      startsWith: '文本必须以 "{{startsWith}}" 开头',
      endsWith: '文本必须以 "{{endsWith}}" 结尾',
    },
    too_small: {
      array: {
        exact: '数组元素必须为 {{minimum}} 个',
        inclusive: '数组元素不得少于 {{minimum}} 个',
        not_inclusive: '数组元素必须超过 {{minimum}} 个',
      },
      string: {
        exact: '文本长度必须为 {{minimum}} 个字符',
        inclusive: '文本长度不得少于 {{minimum}} 个字符',
        not_inclusive: '文本长度必须超过 {{minimum}} 个字符',
      },
      number: {
        exact: '数值必须为 {{minimum}}',
        inclusive: '数值不得小于 {{minimum}}',
        not_inclusive: '数值必须大于 {{minimum}}',
      },
      set: {
        exact: '错误的输入格式',
        inclusive: '错误的输入格式',
        not_inclusive: '错误的输入格式',
      },
      date: {
        exact: '日期必须为 {{- minimum, datetime}}',
        inclusive: '日期不得晚于 {{- minimum, datetime}}',
        not_inclusive: '日期必须早于 {{- minimum, datetime}}',
      },
    },
    too_big: {
      array: {
        exact: '数组元素必须为 {{maximum}} 个',
        inclusive: '数组元素不得多于 {{maximum}} 个',
        not_inclusive: '数组元素必须少于 {{maximum}} 个',
      },
      string: {
        exact: '文本长度必须为 {{maximum}} 个字符',
        inclusive: '文本长度不得多于 {{maximum}} 个字符',
        not_inclusive: '文本长度必须少于 {{maximum}} 个字符',
      },
      number: {
        exact: '数值必须为 {{maximum}}',
        inclusive: '数值不得大于 {{maximum}}',
        not_inclusive: '数值必须小于 {{maximum}}',
      },
      set: {
        exact: '错误的输入格式',
        inclusive: '错误的输入格式',
        not_inclusive: '错误的输入格式',
      },
      date: {
        exact: '日期必须为 {{- maximum, datetime}}',
        inclusive: '日期不得早于 {{- maximum, datetime}}',
        not_inclusive: '日期必须晚于 {{- maximum, datetime}}',
      },
    },
  },
  validations: {
    email: '邮件',
    url: '链接',
    uuid: 'uuid',
    cuid: 'cuid',
    regex: '正则表达式',
    datetime: '日期时间',
  },
  types: {
    function: '函数',
    number: '数字',
    string: '字符串',
    nan: '非数',
    integer: '整数',
    float: '浮点数',
    boolean: '布尔值',
    date: '日期',
    bigint: '大整数',
    undefined: '未定义',
    symbol: '符号',
    null: '空对象',
    array: '数组',
    object: '对象',
    unknown: '未知',
    promise: 'Promise',
    void: '空',
    never: '不存在',
    map: '字典',
    set: '集合',
  },
}

// 创建自定义的 Zod 错误映射函数
export function customErrorMap(): z.ZodErrorMap {
  return (issue, ctx) => {
    const { code } = issue
    const messages = zodErrorMessages.errors
    const validations = zodErrorMessages.validations
    const types = zodErrorMessages.types

    // 处理字符串替换
    function processMessage(
      message: string,
      params: Record<string, any> = {}
    ): string {
      return message.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
        const trimmedKey = key.trim()
        if (trimmedKey.startsWith('-')) {
          // 处理数组类型的参数
          const actualKey = trimmedKey.substring(1).trim()
          if (params[actualKey] && Array.isArray(params[actualKey])) {
            return params[actualKey].join(', ')
          }
        }

        // 处理 expected 和 received 类型转换
        if (trimmedKey === 'expected' && params.expected) {
          return (
            types[params.expected as keyof typeof types] ||
            String(params.expected)
          )
        }
        if (trimmedKey === 'received' && params.received) {
          return (
            types[params.received as keyof typeof types] ||
            String(params.received)
          )
        }

        // 处理 validation 类型
        if (trimmedKey === 'validation' && params.validation) {
          return (
            validations[params.validation as keyof typeof validations] ||
            String(params.validation)
          )
        }

        return params[trimmedKey] !== undefined
          ? String(params[trimmedKey])
          : `{{${key}}}`
      })
    }

    // 根据错误代码处理不同类型的错误
    switch (code) {
      case z.ZodIssueCode.invalid_type:
        if (issue.received === 'undefined') {
          return { message: messages.invalid_type_received_undefined }
        }
        if (issue.received === 'null') {
          return { message: messages.invalid_type_received_null }
        }
        return {
          message: processMessage(messages.invalid_type, {
            expected: issue.expected,
            received: issue.received,
          }),
        }

      case z.ZodIssueCode.invalid_literal:
        return {
          message: processMessage(messages.invalid_literal, {
            expected: issue.expected,
          }),
        }

      case z.ZodIssueCode.unrecognized_keys:
        return {
          message: processMessage(messages.unrecognized_keys, {
            keys: issue.keys,
          }),
        }

      case z.ZodIssueCode.invalid_union:
        return { message: messages.invalid_union }

      case z.ZodIssueCode.invalid_union_discriminator:
        return {
          message: processMessage(messages.invalid_union_discriminator, {
            options: issue.options,
          }),
        }

      case z.ZodIssueCode.invalid_enum_value:
        return {
          message: processMessage(messages.invalid_enum_value, {
            received: issue.received,
            options: issue.options,
          }),
        }

      case z.ZodIssueCode.invalid_arguments:
        return { message: messages.invalid_arguments }

      case z.ZodIssueCode.invalid_return_type:
        return { message: messages.invalid_return_type }

      case z.ZodIssueCode.invalid_date:
        return { message: messages.invalid_date }

      case z.ZodIssueCode.invalid_string:
        if (typeof issue.validation === 'object') {
          if ('startsWith' in issue.validation) {
            return {
              message: processMessage(messages.invalid_string.startsWith, {
                startsWith: issue.validation.startsWith,
              }),
            }
          }
          if ('endsWith' in issue.validation) {
            return {
              message: processMessage(messages.invalid_string.endsWith, {
                endsWith: issue.validation.endsWith,
              }),
            }
          }
        }

        // 处理其他字符串验证类型
        const stringValidation = issue.validation as string
        const invalidStringMessages = messages.invalid_string as Record<
          string,
          string
        >
        if (invalidStringMessages[stringValidation]) {
          return {
            message: processMessage(invalidStringMessages[stringValidation], {
              validation:
                validations[stringValidation as keyof typeof validations],
            }),
          }
        }
        return { message: invalidStringMessages.regex }

      case z.ZodIssueCode.too_small:
        const tooSmallMessage =
          messages.too_small[issue.type as keyof typeof messages.too_small]
        if (!tooSmallMessage) return { message: ctx.defaultError }

        const tooSmallMsgObj = tooSmallMessage as Record<string, string>
        if (issue.inclusive) {
          return {
            message: processMessage(tooSmallMsgObj.inclusive, {
              minimum: issue.minimum,
            }),
          }
        } else {
          return {
            message: processMessage(tooSmallMsgObj.not_inclusive, {
              minimum: issue.minimum,
            }),
          }
        }

      case z.ZodIssueCode.too_big:
        const tooBigMessage =
          messages.too_big[issue.type as keyof typeof messages.too_big]
        if (!tooBigMessage) return { message: ctx.defaultError }

        const tooBigMsgObj = tooBigMessage as Record<string, string>
        if (issue.inclusive) {
          return {
            message: processMessage(tooBigMsgObj.inclusive, {
              maximum: issue.maximum,
            }),
          }
        } else {
          return {
            message: processMessage(tooBigMsgObj.not_inclusive, {
              maximum: issue.maximum,
            }),
          }
        }

      case z.ZodIssueCode.custom:
        return { message: messages.custom }

      case z.ZodIssueCode.invalid_intersection_types:
        return { message: messages.invalid_intersection_types }

      case z.ZodIssueCode.not_multiple_of:
        return {
          message: processMessage(messages.not_multiple_of, {
            multipleOf: issue.multipleOf,
          }),
        }

      case z.ZodIssueCode.not_finite:
        return { message: messages.not_finite }

      default:
        return { message: ctx.defaultError }
    }
  }
}

// 设置全局错误映射
export function setupGlobalZodMessages() {
  z.setErrorMap(customErrorMap())
}
