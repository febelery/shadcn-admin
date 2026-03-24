/**
 * 题型与布局类型注册表键名
 *
 * 为什么这个文件存在？
 * 1. 它是系统中题型/布局类型的唯一事实来源（Source of Truth）。
 * 2. 它通过独立导出类型，避免了 types.ts 与 questions/index.ts 之间的循环依赖。
 */

export const QUESTION_TYPES = [
  'single_choice',
  'multiple_choice',
  'dropdown',
  'matrix_single',
  'matrix_multiple',
  'image_choice',
  'ranking',
  'text',
  'textarea',
  'number',
  'fill_in',
  'date',
  'date_range',
  'rating',
  'nps',
  'file_upload',
  'signature',
] as const

export const LAYOUT_TYPES = ['divider', 'rich_text'] as const

export type QuestionType = (typeof QUESTION_TYPES)[number]
export type LayoutType = (typeof LAYOUT_TYPES)[number]
export type NodeType = QuestionType | LayoutType
