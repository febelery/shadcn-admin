export type SurveyMode = 'scroll' | 'card'
export type SurveyStatus = 'draft' | 'published' | 'archived'
export type BuilderMode = 'build' | 'logic'
export type ContextMode = 'question' | 'survey'

export type NodeType =
  | 'single_choice'
  | 'multiple_choice'
  | 'dropdown'
  | 'matrix_single'
  | 'matrix_multiple'
  | 'image_choice'
  | 'ranking'
  | 'text'
  | 'textarea'
  | 'number'
  | 'fill_in'
  | 'date'
  | 'time'
  | 'date_range'
  | 'time_range'
  | 'rating'
  | 'nps'
  | 'group'
  | 'sub_question'
  | 'repeater'
  | 'linked_choice'
  | 'file_upload'
  | 'geo_location'
  | 'signature'
  | 'block'
  | 'divider'
  | 'rich_text'

export interface ChoiceOption {
  id: string
  label: string
  value: string
  image?: string | null
  order: number
}

export interface NodeValidation {
  id: string
  type:
    | 'required'
    | 'min_length'
    | 'max_length'
    | 'min_value'
    | 'max_value'
    | 'date_range'
    | 'file_type'
    | 'file_size'
    | 'email'
    | 'phone'
    | 'url'
    | 'regex'
  params?: Record<string, unknown>
  message: string
}

export interface NodeConfig {
  options?: ChoiceOption[]
  randomOrder?: boolean
  allowOther?: boolean
  rows?: Array<{ id: string; label: string }>
  columns?: Array<{ id: string; label: string }>
  minRows?: number
  maxRows?: number
  addLabel?: string
  minValue?: number
  maxValue?: number
  step?: number
  starCount?: number
  sourceNodeId?: string
  minSelect?: number
  maxSelect?: number
  starShape?: string
  lowLabel?: string
  highLabel?: string
  showLabels?: boolean
  allowHalf?: boolean
  showNumbers?: boolean
  scaleStart?: 0 | 1
  placeholder?: string
  minLength?: number
  maxLength?: number
  prefix?: string
  suffix?: string
  format?: string
  textAreaRows?: number
}

export interface QuestionNode {
  id: string
  type: NodeType
  parentId: string | null
  order: number
  title: string
  description?: string
  required: boolean
  hidden: boolean
  readonly: boolean
  defaultValue?: unknown
  role?: 'template' | null
  config: NodeConfig
  validations: NodeValidation[]
  extensions: Record<string, unknown>
}

// 逻辑配置相关类型
export type LogicOperator = 'and' | 'or'
export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'not_contains'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'between'
  | 'is_empty'
  | 'is_not_empty'
  | 'regex'

export type ActionType =
  | 'show'
  | 'hide'
  | 'jump_question'
  | 'end'
  | 'set_required'
  | 'set_readonly'
  | 'set_value'
  | 'clear_value'
  | 'show_option'
  | 'hide_option'

export interface ConditionRule {
  field: string
  operator: ConditionOperator
  value?: unknown
}

export interface ConditionGroup {
  operator: LogicOperator
  rules: Array<ConditionRule | ConditionGroup>
}

export interface LogicAction {
  type: ActionType
  target: string
  value?: unknown
}

export interface LogicRule {
  id: string
  name: string
  enabled: boolean
  priority: number
  condition: ConditionGroup
  actions: LogicAction[]
}

// 交叉校验相关类型
export interface CrossValidation {
  id: string
  type: 'cross_field'
  rule: string
  fields: string[]
  message: string
}

// 提交规则相关类型
export interface DailyLimitRule {
  enabled: boolean
  limit: number
  identifyBy: 'ip' | 'device' | 'account' | 'ip_device'
}

export interface QuotaRule {
  enabled: boolean
  total: number
  onExceed: 'close' | 'show_message' | 'redirect'
}

export interface TimeWindowRule {
  enabled: boolean
  startAt?: string
  endAt?: string
  onExpire: 'show_closed' | 'redirect' | 'hide'
}

export interface IpDedupRule {
  enabled: boolean
  limit: number
  onExceed: 'reject' | 'show_message'
}

export interface LoginRule {
  enabled: boolean
  method: 'system' | 'sso' | 'phone' | 'email'
  oncePerAccount: boolean
}

export interface SubmissionRules {
  dailyLimit: DailyLimitRule
  quota: QuotaRule
  timeWindow: TimeWindowRule
  ipDedup: IpDedupRule
  login: LoginRule
}

// 问卷元数据配置相关类型
export interface CardModeConfig {
  transition: 'slide' | 'fade' | 'flip' | 'none'
  progressType: 'dots' | 'bar' | 'fraction'
  allowBack: boolean
}

export interface SurveyMeta {
  title: string
  description: string
  coverType: 'color' | 'image'
  coverColor?: string
  cover?: string
  fontColor?: string
  mode: SurveyMode
  status: SurveyStatus
  cardConfig: CardModeConfig
  submitLabel: string
  endTitle: string
  endDescription: string
  submissionRules: SubmissionRules
  tags: string[]
  createdAt: string
  updatedAt: string
}

// 完整问卷 Schema 相关类型
export interface SurveySchema {
  id: string
  version: string
  meta: SurveyMeta
  schema: QuestionNode[]
  validations: CrossValidation[]
  logic: LogicRule[]
  extensions: Record<string, unknown>
}

// 问卷列表项类型
export interface SurveyListItem {
  id: string
  title: string
  description: string
  status: SurveyStatus
  mode: SurveyMode
  questionCount: number
  responseCount: number
  createdAt: string
  updatedAt: string
}
