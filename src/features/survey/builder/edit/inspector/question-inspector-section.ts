import type { QuestionType } from '../../../core/types'

type QuestionInspectorSection = {
  title: string
  defaultOpen: boolean
}

const QUESTION_INSPECTOR_SECTIONS = {
  single_choice: { title: '选项', defaultOpen: true },
  multiple_choice: { title: '选项', defaultOpen: true },
  dropdown: { title: '选项', defaultOpen: true },
  ranking: { title: '选项', defaultOpen: true },
  matrix_single: { title: '矩阵', defaultOpen: true },
  matrix_multiple: { title: '矩阵', defaultOpen: true },
  cascader: { title: '级联选项', defaultOpen: false },
  text: { title: '文本输入', defaultOpen: false },
  textarea: { title: '文本输入', defaultOpen: false },
  number: { title: '数字', defaultOpen: false },
  email: { title: '文本输入', defaultOpen: false },
  phone: { title: '文本输入', defaultOpen: false },
  url: { title: '文本输入', defaultOpen: false },
  date: { title: '日期', defaultOpen: false },
  date_range: { title: '日期', defaultOpen: false },
  rating: { title: '评分', defaultOpen: false },
  slider: { title: '滑块', defaultOpen: false },
  nps: { title: 'NPS', defaultOpen: false },
  likert: { title: '量表', defaultOpen: false },
  file_upload: { title: '文件上传', defaultOpen: false },
} satisfies Record<QuestionType, QuestionInspectorSection>

export function getQuestionInspectorSection(
  type: QuestionType
): QuestionInspectorSection {
  return QUESTION_INSPECTOR_SECTIONS[type]
}
