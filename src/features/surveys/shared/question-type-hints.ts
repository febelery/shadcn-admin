import type { QuestionType } from '../core/types'

export type PaletteTypeId = QuestionType | 'divider' | 'html_block'

/** 题型库 / 帮助提示文案 */
export const QUESTION_TYPE_HINTS: Record<PaletteTypeId, string> = {
  single_choice: '多个选项中只能选一个，适合性别、满意度等等互斥场景。',
  multiple_choice: '可同时选择多个选项，适合兴趣、功能等多选场景。',
  dropdown: '以下拉菜单展示选项，选项较多时更节省空间。',
  ranking: '将选项按优先级排序，适合偏好、重要性评估。',
  matrix_single: '表格形式：每行选一个列选项，适合多维度打分。',
  matrix_multiple: '表格形式：每行可选多个列，适合多维度勾选。',
  cascader: '省市区等级联选择，适合地区、组织架构等层级数据。',
  text: '单行短文本，适合姓名、标题等简短回答。',
  textarea: '多行长文本，适合意见建议、详细描述。',
  number: '仅允许输入数字，可设置最小/最大值。',
  email: '校验邮箱格式。',
  phone: '校验手机号格式。',
  url: '校验网址格式。',
  date: '选择单个日期。',
  date_range: '选择起止日期区间。',
  fill_in: '在句子中嵌入多个填空，如「我叫___，来自___」。',
  rating: '星级打分，直观表达满意程度。',
  slider: '拖动滑块选择数值。',
  nps: '0–10 分推荐意愿量表（净推荐值 NPS）。',
  likert: '多条陈述 × 同意度选项，用于态度、满意度调研。',
  dynamic_panel: '同一组字段可重复添加，如家庭成员、工作经历。',
  file_upload: '上传图片或文档，可限制数量与大小。',
  signature: '手写签名，用于确认或协议场景。',
  divider: '分割线，区分章节，不收集答案。',
  html_block: '富文本说明块，不收集答案。',
}

/** 需要图示预览的复杂题型 */
export const QUESTION_TYPES_WITH_PREVIEW = new Set<PaletteTypeId>([
  'matrix_single',
  'matrix_multiple',
  'likert',
  'nps',
  'cascader',
  'ranking',
  'dynamic_panel',
  'fill_in',
])

export function getQuestionTypeHint(type: PaletteTypeId): string {
  return QUESTION_TYPE_HINTS[type] ?? '点击或拖拽到画布添加。'
}

export function hasQuestionTypePreview(type: PaletteTypeId): boolean {
  return QUESTION_TYPES_WITH_PREVIEW.has(type)
}
