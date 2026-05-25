import type { QuestionType } from './types'

/** 选择类题型（含排序） */
const CHOICE_QUESTION_TYPES: ReadonlySet<QuestionType> = new Set([
  'single_choice',
  'multiple_choice',
  'dropdown',
  'ranking',
])

const MATRIX_QUESTION_TYPES: ReadonlySet<QuestionType> = new Set([
  'matrix_single',
  'matrix_multiple',
])

const TEXT_INPUT_QUESTION_TYPES: ReadonlySet<QuestionType> = new Set([
  'text',
  'textarea',
  'email',
  'phone',
  'url',
])

const INSPECTOR_SECTION_TITLES: Partial<Record<QuestionType, string>> = {
  single_choice: '选项',
  multiple_choice: '选项',
  dropdown: '选项',
  ranking: '选项',
  matrix_single: '矩阵',
  matrix_multiple: '矩阵',
  likert: '量表',
  cascader: '级联选项',
  rating: '评分',
  slider: '滑块',
  nps: 'NPS',
  dynamic_panel: '自增面板',
  text: '文本输入',
  textarea: '文本输入',
  email: '文本输入',
  phone: '文本输入',
  url: '文本输入',
  number: '数字',
  date: '日期',
  date_range: '日期',
  fill_in: '填空',
  file_upload: '文件上传',
  signature: '签名',
}

export function isChoiceQuestionType(type: QuestionType): boolean {
  return CHOICE_QUESTION_TYPES.has(type)
}

export function isMatrixQuestionType(type: QuestionType): boolean {
  return MATRIX_QUESTION_TYPES.has(type)
}

export function isTextInputQuestionType(type: QuestionType): boolean {
  return TEXT_INPUT_QUESTION_TYPES.has(type)
}

export function getInspectorSectionTitle(type: QuestionType): string {
  return INSPECTOR_SECTION_TITLES[type] ?? '题型配置'
}

export function inspectorSectionDefaultOpen(type: QuestionType): boolean {
  return isChoiceQuestionType(type) || isMatrixQuestionType(type)
}
