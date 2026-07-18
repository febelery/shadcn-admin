import type { QuestionType } from '../core/types'

export type PaletteTypeId = QuestionType | 'divider' | 'rich_text'

/** 题型库 / 帮助提示文案 */
const QUESTION_TYPE_HINTS: Record<PaletteTypeId, string> = {
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
  phone: '电话号码输入，不预设国家或地区格式。',
  url: '校验网址格式。',
  date: '选择单个日期。',
  date_range: '选择起止日期区间。',
  rating: '星级打分，直观表达满意程度。',
  slider: '拖动滑块选择数值。',
  nps: '0–10 分推荐意愿量表（净推荐值 NPS）。',
  likert: '多条陈述 × 同意度选项，用于态度、满意度调研。',
  divider: '分割线，区分章节，不收集答案。',
  rich_text: '富文本说明块，不收集答案。',
}

/** 需要图示预览的复杂题型 */
const QUESTION_TYPES_WITH_PREVIEW = new Set<PaletteTypeId>([
  'matrix_single',
  'matrix_multiple',
  'likert',
  'nps',
  'cascader',
  'ranking',
])

export function getQuestionTypeHint(type: PaletteTypeId): string {
  return QUESTION_TYPE_HINTS[type] ?? '点击或拖拽到画布添加。'
}

export function hasQuestionTypePreview(type: PaletteTypeId): boolean {
  return QUESTION_TYPES_WITH_PREVIEW.has(type)
}

/** 题型库搜索别名（中文简称 + 英文技术词） */
const QUESTION_TYPE_KEYWORDS: Record<PaletteTypeId, string[]> = {
  single_choice: ['单选', 'radio', 'single choice'],
  multiple_choice: ['多选', 'checkbox', 'multiple choice'],
  dropdown: ['下拉', 'select', 'dropdown'],
  ranking: ['排序', 'rank', 'ranking'],
  matrix_single: ['矩阵单选', 'matrix single'],
  matrix_multiple: ['矩阵多选', 'matrix multiple'],
  cascader: ['级联', 'cascade', 'cascader'],
  text: ['单行', 'text', 'input'],
  textarea: ['多行', 'textarea', 'long text'],
  number: ['数字', 'number', 'numeric'],
  email: ['邮箱', 'email', 'mail'],
  phone: ['电话', '手机', 'phone', 'mobile', 'tel'],
  url: ['网址', 'url', 'link', 'website'],
  date: ['日期', 'date'],
  date_range: ['日期范围', 'date range', 'daterange'],
  rating: ['星级', 'star', 'rating'],
  slider: ['滑块', 'slider', 'range'],
  nps: ['nps', '净推荐', 'net promoter'],
  likert: ['李克特', 'likert', 'scale'],
  divider: ['分割', 'divider', 'separator', 'hr'],
  rich_text: ['富文本', 'rich text', '说明'],
}

export function matchesPaletteSearch(
  item: { type: PaletteTypeId; label: string; category: string },
  query: string
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const hint = getQuestionTypeHint(item.type)
  const typeSpaced = item.type.replace(/_/g, ' ').toLowerCase()
  const typeCompact = item.type.replace(/_/g, '').toLowerCase()
  const keywords = QUESTION_TYPE_KEYWORDS[item.type] ?? []

  const haystack = [
    item.label,
    item.category,
    hint,
    typeSpaced,
    typeCompact,
    ...keywords,
  ].map((s) => s.toLowerCase())

  return haystack.some((text) => text.includes(q))
}
