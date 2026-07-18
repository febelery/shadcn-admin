/** Canonical survey document. Text content is stored without locale wrappers. */

export type SurveyStatus = 'draft' | 'published' | 'archived'

export type PresentationMode = { type: 'scroll' }

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

export type VariableSource = 'url' | 'hidden' | 'literal'

export interface SurveyVariable {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean'
  source: VariableSource
  default?: string | number | boolean
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
  'fill_in',
  'rating',
  'slider',
  'nps',
  'likert',
  'dynamic_panel',
  'file_upload',
  'signature',
] as const

export type QuestionType = (typeof QUESTION_TYPES)[number]

export interface ChoiceOption {
  id: string
  label: string
  /** 是否为「其他」可自填项 */
  isOther?: boolean
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
  otherPlaceholder?: string
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
  dateMode?: 'date' | 'datetime'
  minDate?: string
  maxDate?: string
  npsLeftLabel?: string
  npsRightLabel?: string
  acceptTypes?: string[]
  maxCount?: number
  maxSize?: number
  templateElements?: SurveyElement[]
  minItems?: number
  maxItems?: number
  addLabel?: string
}

type StrictQuestionConfig<Config extends Partial<QuestionConfigFields>> =
  Config & {
    [Key in Exclude<keyof QuestionConfigFields, keyof Config>]?: never
  }

type ChoiceConfig = {
  options: ChoiceOption[]
  otherPlaceholder?: string
  randomizeOptions?: boolean
  optionLayout?: 'vertical' | 'horizontal'
}

type TextConfig = {
  placeholder?: string
  minLength?: number
  maxLength?: number
}

type DateConfig = {
  dateMode?: 'date' | 'datetime'
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
  fill_in: StrictQuestionConfig<Record<never, never>>
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
  dynamic_panel: StrictQuestionConfig<{
    templateElements: SurveyElement[]
    minItems: number
    maxItems: number
    addLabel?: string
  }>
  file_upload: StrictQuestionConfig<{
    acceptTypes?: string[]
    maxCount: number
    maxSize: number
  }>
  signature: StrictQuestionConfig<Record<never, never>>
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

export interface PanelElement extends BaseElement {
  kind: 'panel'
  title?: string
  collapsible?: boolean
  elements: SurveyElement[]
}

export interface DividerElement extends BaseElement {
  kind: 'divider'
}

export interface HtmlBlockElement extends BaseElement {
  kind: 'html_block'
  html: string
}

export type SurveyElement =
  | QuestionElement
  | PanelElement
  | DividerElement
  | HtmlBlockElement

export interface Section {
  id: string
  title?: string
  description?: string
  elements: SurveyElement[]
}

export type RuleActionType = 'show' | 'hide' | 'jump_to_question' | 'end'

/** 设计器顶栏模式：编辑内容 / 流程图 */
export type BuilderMode = 'edit' | 'flow'

export interface RuleAction {
  id: string
  type: RuleActionType
  target?: string
  value?: unknown
}

export type RulePresenceConditionOperator = 'empty' | 'not_empty'

export type RuleValueConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'not_contains'

export type RuleConditionOperator =
  | RulePresenceConditionOperator
  | RuleValueConditionOperator

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
  priority: number
  condition: RuleCondition
  action: RuleAction
}

export interface CrossFieldValidator {
  id: string
  fields: string[]
  rule: string
  message: string
}

export interface SubmissionQuota {
  enabled: boolean
  /** 问卷总回收份数上限 */
  total: number
}

export interface SubmissionTimeWindow {
  enabled: boolean
  /** 本地时间 yyyy-MM-dd'T'HH:mm:ss */
  startAt?: string
  endAt?: string
}

export interface SubmissionRateLimit {
  enabled: boolean
  /** 每人累计最多提交次数（0 表示不限制） */
  maxPerUser?: number
  /** 每人每天最多提交次数 */
  maxPerUserPerDay?: number
  /** 问卷每天总回收份数上限 */
  maxPerDay?: number
}

export interface SubmissionConfig {
  quota?: SubmissionQuota
  timeWindow?: SubmissionTimeWindow
  rateLimit?: SubmissionRateLimit
  /** 每设备仅可提交一次 */
  oncePerDevice?: boolean
  /** 每用户仅可提交一次（需登录态，由填写端实现） */
  oncePerUser?: boolean
  /** 访问密码，空则不校验 */
  password?: string
}

export interface SurveyDocument {
  id: string
  /** 持久化文档格式版本；只随文档契约变更。 */
  schemaVersion: 1
  /** 发布修订号；每次成功发布后递增。 */
  revision: number
  status: SurveyStatus
  slug?: string
  publishedAt?: string
  meta: SurveyMeta
  presentation: PresentationMode
  theme: ThemeConfig
  variables: SurveyVariable[]
  sections: [Section]
  rules: Rule[]
  validators: CrossFieldValidator[]
  submission: SubmissionConfig
  extensions?: Record<string, unknown>
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
