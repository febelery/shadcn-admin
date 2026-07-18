import type { RichTextContent } from './rich-text'

/** Canonical survey document. Text content is stored without locale wrappers. */

export type SurveyStatus = 'draft' | 'published' | 'archived'

export type CoverType = 'none' | 'color' | 'image'

export type SurveyDefaultNumberingStyle =
  | 'decimal'
  | 'chinese'
  | 'decimal_paren'
  | 'decimal_bracket'
  | 'letter_upper'
  | 'letter_lower'
  | 'roman_upper'
  | 'roman_lower'
  | 'none'

/** 题号编号方式：全局序号 / 仅对已显示题号的题目连续编号 */
export type QuestionNumberingMode = 'global' | 'continuous'

/** 单题题号：仅控制是否显示（样式由问卷 meta 统一） */
export interface QuestionNumbering {
  /** 是否显示题号，默认 true */
  show?: boolean
}

export interface SurveyMeta {
  title: string
  description: string
  /** 头图：无 / 纯色 / 图片 */
  coverType: CoverType
  coverColor?: string
  /** 头图图片 URL（coverType 为 image 时） */
  cover?: string
  submitLabel: string
  endTitle: string
  endDescription: string
  /** 全卷题号样式；none 表示全卷不显示题号 */
  defaultQuestionNumbering?: SurveyDefaultNumberingStyle
  /** 题号编号方式，默认 global */
  questionNumberingMode?: QuestionNumberingMode
}

export interface ThemeConfig {
  primaryColor: string
  backgroundColor: string
  borderRadius: string
  fontFamily?: string
}

export const QUESTION_TYPES = [
  'single_choice',
  'multiple_choice',
  'dropdown',
  'ranking',
  'matrix_single',
  'matrix_multiple',
  'cascader',
  'text',
  'textarea',
  'number',
  'email',
  'phone',
  'url',
  'date',
  'date_range',
  'rating',
  'slider',
  'nps',
  'likert',
] as const

export type QuestionType = (typeof QUESTION_TYPES)[number]

export interface ChoiceOption {
  id: string
  label: string
}

export interface MatrixRow {
  id: string
  label: string
}

export interface MatrixColumn {
  id: string
  label: string
}

export interface CascaderNode {
  id: string
  label: string
  children?: CascaderNode[]
}

export interface LikertStatement {
  id: string
  label: string
}

interface QuestionConfigFields {
  options: ChoiceOption[]
  rows?: MatrixRow[]
  columns?: MatrixColumn[]
  cascaderOptions?: CascaderNode[]
  statements?: LikertStatement[]
  scaleMin?: number
  scaleMax?: number
  minSelect?: number
  maxSelect?: number
  randomizeOptions?: boolean
  optionLayout?: 'vertical' | 'horizontal'
  starCount?: number
  minValue?: number
  maxValue?: number
  step?: number
  placeholder?: string
  minLength?: number
  maxLength?: number
  textareaRows?: number
  minDate?: string
  maxDate?: string
  npsLeftLabel?: string
  npsRightLabel?: string
}

type StrictQuestionConfig<Config extends Partial<QuestionConfigFields>> =
  Config & {
    [Key in Exclude<keyof QuestionConfigFields, keyof Config>]?: never
  }

type ChoiceConfig = {
  options: ChoiceOption[]
  randomizeOptions?: boolean
  optionLayout?: 'vertical' | 'horizontal'
}

type TextConfig = {
  placeholder?: string
  minLength?: number
  maxLength?: number
}

type DateConfig = {
  minDate?: string
  maxDate?: string
  placeholder?: string
}

export interface QuestionConfigByType {
  single_choice: StrictQuestionConfig<ChoiceConfig>
  multiple_choice: StrictQuestionConfig<
    ChoiceConfig & { minSelect?: number; maxSelect?: number }
  >
  dropdown: StrictQuestionConfig<
    Pick<ChoiceConfig, 'options' | 'randomizeOptions'> & {
      placeholder?: string
    }
  >
  ranking: StrictQuestionConfig<
    Pick<ChoiceConfig, 'options' | 'randomizeOptions'>
  >
  matrix_single: StrictQuestionConfig<{
    rows: MatrixRow[]
    columns: MatrixColumn[]
  }>
  matrix_multiple: StrictQuestionConfig<{
    rows: MatrixRow[]
    columns: MatrixColumn[]
  }>
  cascader: StrictQuestionConfig<{
    cascaderOptions: CascaderNode[]
    placeholder?: string
  }>
  text: StrictQuestionConfig<TextConfig>
  textarea: StrictQuestionConfig<TextConfig & { textareaRows?: number }>
  number: StrictQuestionConfig<{
    placeholder?: string
    minValue?: number
    maxValue?: number
    step?: number
  }>
  email: StrictQuestionConfig<TextConfig>
  phone: StrictQuestionConfig<TextConfig>
  url: StrictQuestionConfig<TextConfig>
  date: StrictQuestionConfig<DateConfig>
  date_range: StrictQuestionConfig<DateConfig>
  rating: StrictQuestionConfig<{ starCount: number }>
  slider: StrictQuestionConfig<{
    minValue: number
    maxValue: number
    step: number
  }>
  nps: StrictQuestionConfig<{
    npsLeftLabel?: string
    npsRightLabel?: string
  }>
  likert: StrictQuestionConfig<{
    statements: LikertStatement[]
    scaleMin: number
    scaleMax: number
  }>
}

export type QuestionConfig<Type extends QuestionType = QuestionType> =
  QuestionConfigByType[Type]

export type QuestionConfigPatch<Type extends QuestionType = QuestionType> =
  Type extends QuestionType ? Partial<QuestionConfigByType[Type]> : never

export interface BaseElement {
  id: string
}

interface QuestionElementBase<Type extends QuestionType> extends BaseElement {
  kind: 'question'
  type: Type
  title: string
  description?: string
  required: boolean
  numbering?: QuestionNumbering
  config: QuestionConfig<Type>
}

export type QuestionElement<Type extends QuestionType = QuestionType> = {
  [Question in Type]: QuestionElementBase<Question>
}[Type]

export type QuestionContentPatch = Partial<
  Pick<QuestionElement, 'title' | 'description' | 'required' | 'numbering'>
>

export interface DividerElement extends BaseElement {
  kind: 'divider'
}

export interface RichTextBlockElement extends BaseElement {
  kind: 'rich_text'
  content: RichTextContent
}

export type SurveyElement =
  QuestionElement | DividerElement | RichTextBlockElement

export type RuleActionType = 'show' | 'hide' | 'jump_to_question' | 'end'

/** 设计器顶栏模式：编辑内容 / 流程图 */
export type BuilderMode = 'edit' | 'flow'

export interface RuleAction {
  id: string
  type: RuleActionType
  target?: string
}

export type RulePresenceConditionOperator = 'empty' | 'not_empty'

export type RuleValueConditionOperator =
  'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains'

export type RuleConditionOperator =
  RulePresenceConditionOperator | RuleValueConditionOperator

export type RuleCondition =
  | {
      questionId: string
      operator: RulePresenceConditionOperator
    }
  | {
      questionId: string
      operator: RuleValueConditionOperator
      value: string | number
    }

export interface Rule {
  id: string
  name: string
  enabled: boolean
  condition: RuleCondition
  action: RuleAction
}

export interface SubmissionPolicy {
  /** 问卷累计提交上限 */
  totalLimit?: number
  /** 问卷每天提交上限 */
  dailyLimit?: number
  /** 每位用户累计提交上限 */
  perUserLimit?: number
  /** 每位用户每天提交上限 */
  dailyPerUserLimit?: number
  /** 每台设备累计提交上限 */
  perDeviceLimit?: number
  /** ISO 8601 UTC instant */
  opensAt?: string
  closesAt?: string
  /** 访问密码；字段不存在时不校验 */
  accessPassword?: string
}

export interface SurveyDocument {
  id: string
  /** 持久化文档格式版本；只随文档契约变更。 */
  schemaVersion: 2
  /** 发布修订号；每次成功发布后递增。 */
  revision: number
  status: SurveyStatus
  slug?: string
  publishedAt?: string
  meta: SurveyMeta
  theme: ThemeConfig
  elements: SurveyElement[]
  rules: Rule[]
  submissionPolicy: SubmissionPolicy
}

export interface SurveyListItem {
  id: string
  title: string
  description: string
  status: SurveyStatus
  questionCount: number
  recordCount: number
  createdAt: string
  updatedAt: string
  slug?: string
}

/** 答题/提交记录数据结构 */
export interface SurveyRecordItem {
  id: string
  surveyId: string
  respondent?: string
  status: 'partial' | 'complete'
  answers: Record<string, unknown>
  startedAt: string
  completedAt?: string
  durationMs?: number
}
