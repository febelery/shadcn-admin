import type {
  QuestionNumberingMode,
  SurveyDefaultNumberingStyle,
} from '../core/types'
import { questionNumberText, questionNumberTextWide } from './question-layout'

export function getQuestionNumberTextClass(
  style: SurveyDefaultNumberingStyle
): string {
  return style === 'chinese' ? questionNumberTextWide : questionNumberText
}

export const SURVEY_NUMBERING_OPTIONS: {
  value: SurveyDefaultNumberingStyle
  label: string
  sample: string
}[] = [
  { value: 'decimal', label: '阿拉伯数字', sample: '1. 2. 3.' },
  { value: 'decimal_paren', label: '括号数字', sample: '(1) (2) (3)' },
  { value: 'decimal_bracket', label: '方括号数字', sample: '[1] [2] [3]' },
  { value: 'chinese', label: '中文序号', sample: '一、二、三' },
  { value: 'letter_upper', label: '大写字母', sample: 'A. B. C.' },
  { value: 'letter_lower', label: '小写字母', sample: 'a. b. c.' },
  { value: 'roman_upper', label: '罗马数字（大写）', sample: 'I. II. III.' },
  { value: 'roman_lower', label: '罗马数字（小写）', sample: 'i. ii. iii.' },
  { value: 'none', label: '不显示题号', sample: '—' },
]

export const SURVEY_NUMBERING_MODE_OPTIONS: {
  value: QuestionNumberingMode
  label: string
  hint: string
}[] = [
  {
    value: 'global',
    label: '按卷内顺序',
    hint: '隐藏题号后仍保留卷内序号（如 1、3、5）',
  },
  {
    value: 'continuous',
    label: '仅显示题连续编号',
    hint: '只对显示题号的题目从 1 起连续编号，隐藏题不占号',
  },
]
