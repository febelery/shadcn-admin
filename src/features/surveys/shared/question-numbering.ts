import type {
  QuestionElement,
  QuestionNumberingMode,
  SurveyDefaultNumberingStyle,
  SurveySchema,
} from '../core/types'
import { flattenQuestions } from '../core/schema-defaults'
import { questionNumberText, questionNumberTextWide } from './question-layout'

export type {
  SurveyDefaultNumberingStyle,
  QuestionNumbering,
  QuestionNumberingMode,
} from '../core/types'

const ZH_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']

const ROMAN_VALS = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1] as const
const ROMAN_SYMS = [
  'M',
  'CM',
  'D',
  'CD',
  'C',
  'XC',
  'L',
  'XL',
  'X',
  'IX',
  'V',
  'IV',
  'I',
] as const

type NumberingStyleKey = Exclude<SurveyDefaultNumberingStyle, 'none'>

const NUMBER_LABEL_FORMATTERS: Record<
  NumberingStyleKey,
  (ordinal: number) => string
> = {
  decimal: (n) => `${n}.`,
  chinese: (n) => `${toChineseNumeral(n)}、`,
  decimal_paren: (n) => `(${n}) `,
  decimal_bracket: (n) => `[${n}] `,
  letter_upper: (n) => `${toLetterOrdinal(n, true)}.`,
  letter_lower: (n) => `${toLetterOrdinal(n, false)}.`,
  roman_upper: (n) => `${toRomanNumeral(n, true)}.`,
  roman_lower: (n) => `${toRomanNumeral(n, false)}.`,
}

/** 1–99 的中文序号（用于题号） */
function toChineseNumeral(n: number): string {
  if (n <= 0 || !Number.isFinite(n)) return String(n)
  if (n < 10) return ZH_DIGITS[n]
  if (n === 10) return '十'
  if (n < 20) return `十${ZH_DIGITS[n - 10]}`
  if (n < 100) {
    const tens = Math.floor(n / 10)
    const ones = n % 10
    return `${ZH_DIGITS[tens]}十${ones ? ZH_DIGITS[ones] : ''}`
  }
  return String(n)
}

/** Excel 列标式字母：1→A，26→Z，27→AA */
function toLetterOrdinal(n: number, upper: boolean): string {
  if (n <= 0 || !Number.isFinite(n)) return String(n)
  const base = upper ? 65 : 97
  let num = Math.floor(n)
  let out = ''
  while (num > 0) {
    num -= 1
    out = String.fromCharCode(base + (num % 26)) + out
    num = Math.floor(num / 26)
  }
  return out || String(n)
}

/** 1–3999 罗马数字；超出范围回退为阿拉伯数字 */
function toRomanNumeral(n: number, upper: boolean): string {
  if (n <= 0 || !Number.isFinite(n)) return String(n)
  if (n > 3999) return String(n)
  let num = Math.floor(n)
  let result = ''
  for (let i = 0; i < ROMAN_VALS.length; i++) {
    while (num >= ROMAN_VALS[i]) {
      result += ROMAN_SYMS[i]
      num -= ROMAN_VALS[i]
    }
  }
  return upper ? result : result.toLowerCase()
}

export function getSurveyDefaultNumberingStyle(
  schema: SurveySchema
): SurveyDefaultNumberingStyle {
  return schema.meta.defaultQuestionNumbering ?? 'decimal'
}

export function getQuestionNumberingMode(schema: SurveySchema): QuestionNumberingMode {
  return schema.meta.questionNumberingMode ?? 'global'
}

/** 全卷是否启用题号（系统级） */
export function isSurveyNumberingEnabled(
  surveyStyle: SurveyDefaultNumberingStyle
): boolean {
  return surveyStyle !== 'none'
}

/** 单题是否显示题号 */
export function isQuestionNumberVisible(
  question: QuestionElement,
  surveyStyle: SurveyDefaultNumberingStyle
): boolean {
  if (!isSurveyNumberingEnabled(surveyStyle)) return false
  if (question.numbering?.show === false) return false
  return true
}

/** 卷内全局序号（每题均有，用于连续模式下编辑器对照） */
export function buildQuestionOrdinalMap(
  schema: SurveySchema
): Map<string, number> {
  const map = new Map<string, number>()
  flattenQuestions(schema).forEach((q, i) => map.set(q.id, i + 1))
  return map
}

/**
 * 填写端展示用序号：global 同卷内顺序；continuous 仅对已显示题号的题目 1、2、3…
 * 隐藏题在连续模式下值为 null。
 */
export function buildQuestionDisplayOrdinalMap(
  schema: SurveySchema
): Map<string, number | null> {
  const style = getSurveyDefaultNumberingStyle(schema)
  const mode = getQuestionNumberingMode(schema)
  const map = new Map<string, number | null>()

  if (mode === 'global') {
    flattenQuestions(schema).forEach((q, i) => map.set(q.id, i + 1))
    return map
  }

  let visibleCount = 0
  for (const q of flattenQuestions(schema)) {
    if (isQuestionNumberVisible(q, style)) {
      visibleCount += 1
      map.set(q.id, visibleCount)
    } else {
      map.set(q.id, null)
    }
  }
  return map
}

/** 按序号生成题号文案（不考虑单题显隐） */
export function getQuestionNumberLabel(
  ordinal: number,
  surveyStyle: SurveyDefaultNumberingStyle = 'decimal'
): string | null {
  if (surveyStyle === 'none') return null
  const format = NUMBER_LABEL_FORMATTERS[surveyStyle as NumberingStyleKey]
  return format ? format(ordinal) : `${ordinal}.`
}

export function getQuestionNumberTextClass(
  style: SurveyDefaultNumberingStyle
): string {
  return style === 'chinese' ? questionNumberTextWide : questionNumberText
}

export const SURVEY_NUMBERING_OPTIONS: {
  value: SurveyDefaultNumberingStyle
  label: string
  /** 下拉中展示的样例题号（纯文字） */
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
