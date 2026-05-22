/** Survey Schema — plain strings, no locales */

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

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'dropdown'
  | 'ranking'
  | 'matrix_single'
  | 'matrix_multiple'
  | 'cascader'
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'url'
  | 'date'
  | 'date_range'
  | 'fill_in'
  | 'rating'
  | 'slider'
  | 'nps'
  | 'likert'
  | 'dynamic_panel'
  | 'file_upload'
  | 'signature'

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

/**
 * 题目 config（扁平结构，便于 patch / 表单绑定）。
 */
export interface QuestionConfig {
  options?: ChoiceOption[]
  rows?: MatrixRow[]
  columns?: MatrixColumn[]
  cascaderOptions?: CascaderNode[]
  statements?: LikertStatement[]
  scaleMin?: number
  scaleMax?: number
  minSelect?: number
  maxSelect?: number
  allowOther?: boolean
  otherLabel?: string
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

export interface BaseElement {
  id: string
}

export interface QuestionElement extends BaseElement {
  kind: 'question'
  type: QuestionType
  title: string
  description?: string
  required: boolean
  numbering?: QuestionNumbering
  config: QuestionConfig
}

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

export interface Rule {
  id: string
  name: string
  enabled: boolean
  priority: number
  when: string
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

export interface SurveySchema {
  id: string
  version: string
  status: SurveyStatus
  slug?: string
  publishedAt?: string
  meta: SurveyMeta
  presentation: PresentationMode
  theme: ThemeConfig
  variables: SurveyVariable[]
  sections: Section[]
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
