import type { QuestionElement, QuestionType } from '../types'

const RULE_SOURCE_TYPES: ReadonlySet<QuestionType> = new Set([
  'single_choice',
  'multiple_choice',
  'dropdown',
  'text',
  'textarea',
  'number',
  'email',
  'phone',
  'url',
  'date',
  'rating',
  'slider',
  'nps',
])

const CHOICE_VALUE_TYPES: ReadonlySet<QuestionType> = new Set([
  'single_choice',
  'multiple_choice',
  'dropdown',
])

export function canUseQuestionTypeAsRuleSource(type: QuestionType): boolean {
  return RULE_SOURCE_TYPES.has(type)
}

export function canUseQuestionAsRuleSource(q: QuestionElement): boolean {
  if (!canUseQuestionTypeAsRuleSource(q.type)) return false
  if (CHOICE_VALUE_TYPES.has(q.type)) {
    return (q.config.options?.length ?? 0) > 0
  }
  return true
}

export function ruleSourceUnavailableReason(type: QuestionType): string {
  switch (type) {
    case 'matrix_single':
    case 'matrix_multiple':
      return '矩阵题需要按行列单元格建条件，当前规则编辑器不支持。'
    case 'ranking':
      return '排序题答案结构复杂，当前规则编辑器不支持。'
    case 'cascader':
      return '级联题需要按层级路径建条件，当前规则编辑器不支持。'
    case 'likert':
      return '李克特量表包含多条陈述，当前规则编辑器不支持。'
    case 'dynamic_panel':
      return '重复组包含多份子表单，不能作为单一条件题。'
    case 'file_upload':
      return '文件上传题不能作为条件题。'
    case 'signature':
      return '签名题不能作为条件题。'
    case 'fill_in':
      return '填空题包含多个空位，当前规则编辑器不支持。'
    default:
      return '该题型当前不能作为条件题。'
  }
}
