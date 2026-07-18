import { flattenQuestions } from './document-elements'
import type {
  QuestionElement,
  QuestionNumberingMode,
  SurveyDefaultNumberingStyle,
  SurveyDocument,
} from './types'

const ZH_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']

const ROMAN_VALS = [
  1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1,
] as const
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
  document: SurveyDocument
): SurveyDefaultNumberingStyle {
  return document.meta.defaultQuestionNumbering ?? 'decimal'
}

export function getQuestionNumberingMode(
  document: SurveyDocument
): QuestionNumberingMode {
  return document.meta.questionNumberingMode ?? 'global'
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

interface QuestionNumberingProjection {
  ordinals: Map<string, number>
  displayOrdinals: Map<string, number | null>
  prefixes: Map<string, string | null>
  referenceLabels: Map<string, string>
}

const numberingProjectionCache = new WeakMap<
  SurveyDocument['elements'],
  Map<string, QuestionNumberingProjection>
>()

function getQuestionNumberingProjection(
  document: SurveyDocument
): QuestionNumberingProjection {
  const style = getSurveyDefaultNumberingStyle(document)
  const mode = getQuestionNumberingMode(document)
  const cacheKey = `${style}:${mode}`
  let projectionsByConfig = numberingProjectionCache.get(document.elements)
  const cached = projectionsByConfig?.get(cacheKey)
  if (cached) return cached

  const questions = flattenQuestions(document)
  const ordinals = new Map<string, number>()
  const displayOrdinals = new Map<string, number | null>()
  const prefixes = new Map<string, string | null>()
  const referenceLabels = new Map<string, string>()

  let visibleCount = 0
  questions.forEach((question, index) => {
    const globalOrdinal = index + 1
    const visible = isQuestionNumberVisible(question, style)
    if (visible) visibleCount += 1
    const displayOrdinal =
      mode === 'global' ? globalOrdinal : visible ? visibleCount : null
    const title = question.title?.trim()

    ordinals.set(question.id, globalOrdinal)
    displayOrdinals.set(question.id, displayOrdinal)

    if (!visible || displayOrdinal == null) {
      prefixes.set(question.id, null)
      referenceLabels.set(question.id, title || `题目 ${globalOrdinal}`)
      return
    }

    const prefix = getQuestionNumberLabel(displayOrdinal, style)
    prefixes.set(question.id, prefix)
    referenceLabels.set(
      question.id,
      prefix
        ? title
          ? `${prefix} ${title}`
          : prefix
        : title || `题目 ${globalOrdinal}`
    )
  })

  const projection = {
    ordinals,
    displayOrdinals,
    prefixes,
    referenceLabels,
  }
  if (!projectionsByConfig) {
    projectionsByConfig = new Map()
    numberingProjectionCache.set(document.elements, projectionsByConfig)
  }
  projectionsByConfig.set(cacheKey, projection)
  return projection
}

/** 卷内全局序号（每题均有，用于连续模式下编辑器对照） */
export function buildQuestionOrdinalMap(
  document: SurveyDocument
): Map<string, number> {
  return getQuestionNumberingProjection(document).ordinals
}

/**
 * 填写端展示用序号：global 同卷内顺序；continuous 仅对已显示题号的题目 1、2、3…
 * 隐藏题在连续模式下值为 null。
 */
export function buildQuestionDisplayOrdinalMap(
  document: SurveyDocument
): Map<string, number | null> {
  return getQuestionNumberingProjection(document).displayOrdinals
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

/** 流程图/规则列表用：仅题号前缀，未启用题号时返回 null */
export function getQuestionNumberPrefix(
  question: QuestionElement,
  document: SurveyDocument
): string | null {
  return (
    getQuestionNumberingProjection(document).prefixes.get(question.id) ?? null
  )
}

/** 编辑器/流程图用：带题号的题目引用文案 */
export function getQuestionReferenceLabel(
  question: QuestionElement,
  document: SurveyDocument
): string {
  return (
    getQuestionNumberingProjection(document).referenceLabels.get(question.id) ??
    question.title ??
    ''
  )
}
