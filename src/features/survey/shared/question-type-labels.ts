import type { QuestionType } from '../core/types'

const QUESTION_TYPE_LABELS = {
  single_choice: '单选题',
  multiple_choice: '多选题',
  dropdown: '下拉选择',
  ranking: '排序题',
  matrix_single: '矩阵单选',
  matrix_multiple: '矩阵多选',
  cascader: '级联选择',
  text: '单行文本',
  textarea: '多行文本',
  number: '数字',
  email: '邮箱',
  phone: '手机号',
  url: '网址',
  date: '日期',
  date_range: '日期范围',
  rating: '星级评分',
  slider: '滑块',
  nps: 'NPS 净推荐值',
  likert: '李克特量表',
} satisfies Record<QuestionType, string>

export function getQuestionTypeLabel(type: QuestionType): string {
  return QUESTION_TYPE_LABELS[type]
}
