export type SurveyMode = 'scroll' | 'card'
export type SurveyStatus = 'draft' | 'published' | 'archived'
export type BuilderMode = 'build' | 'logic'
export type InspectorTarget = 'node' | 'survey'

export type QuestionType =
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
  | 'date_range'
  | 'rating'
  | 'nps'
  | 'file_upload'
  | 'signature'

export type LayoutType = 'divider' | 'rich_text'

export type NodeType = QuestionType | LayoutType

/**
 * 类型守卫
 */
export const isQuestionNode = (type: NodeType): type is QuestionType =>
  !['divider', 'rich_text'].includes(type)

export const isLayoutNode = (type: NodeType): type is LayoutType =>
  ['divider', 'rich_text'].includes(type)

/**
 * 题型分类 (用于侧边栏和斜杠命令)
 */
export const QUESTION_TYPE_CATEGORIES = [
  '选择类',
  '输入类',
  '评价类',
  '媒体',
  '布局',
] as const

/**
 * 填空题解析正则
 */
export const FILL_IN_SPLIT_RE = /(\(\)|（）|__+|＿＿+)/
export const FILL_IN_TEST_RE = /^(\(\)|（）|__+|＿＿+)$/

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

/**
 * 题型与可用校验类型的映射
 */
const VALIDATION_MAP: Partial<Record<NodeType, NodeValidation['type'][]>> = {
  text: ['min_length', 'max_length', 'email', 'phone', 'url', 'regex'],
  textarea: ['min_length', 'max_length', 'regex'],
  number: ['min_value', 'max_value'],
  date: ['date_range'],
  date_range: ['date_range'],
  file_upload: ['file_type', 'file_size'],
}

export function getValidationsForType(
  type: NodeType
): NodeValidation['type'][] {
  return VALIDATION_MAP[type] ?? []
}

export interface NodeConfig {
  options?: ChoiceOption[]
  randomOrder?: boolean
  allowOther?: boolean
  rows?: Array<{ id: string; label: string }>
  columns?: Array<{ id: string; label: string }>
  minValue?: number
  maxValue?: number
  step?: number
  starCount?: number
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
  detractorLabel?: string
  passiveLabel?: string
  promoterLabel?: string
  unit?: string
  showUnit?: boolean
  minDate?: string
  maxDate?: string
  showTime?: boolean
  endPlaceholder?: string
  acceptTypes?: string[]
  maxCount?: number
  maxSize?: number
  allowImage?: boolean
  isBlackOnly?: boolean
}

export interface QuestionNode {
  id: string
  type: NodeType
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
type LogicOperator = 'and' | 'or'
export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'not_contains'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
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

// 逻辑动作 UI 配置
export interface LogicActionConfig {
  type: ActionType
  label: string
  color: string
  cssVar: string
}

export const LOGIC_ACTION_CONFIG: Record<string, LogicActionConfig> = {
  jump_question: {
    type: 'jump_question',
    label: '跳题',
    color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
    cssVar: 'hsl(217 91% 60%)',
  },
  show: {
    type: 'show',
    label: '显示',
    color: 'bg-green-500/20 text-green-700 dark:text-green-300',
    cssVar: 'hsl(142 71% 45%)',
  },
  hide: {
    type: 'hide',
    label: '隐藏',
    color: 'bg-destructive/15 text-destructive',
    cssVar: 'hsl(0 84% 60%)',
  },
  end: {
    type: 'end',
    label: '结束',
    color: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
    cssVar: 'hsl(25 95% 53%)',
  },
  set_required: {
    type: 'set_required',
    label: '必填',
    color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
    cssVar: 'hsl(270 67% 55%)',
  },
  set_readonly: {
    type: 'set_readonly',
    label: '只读',
    color: 'bg-muted text-muted-foreground',
    cssVar: 'hsl(215 14% 55%)',
  },
  set_value: {
    type: 'set_value',
    label: '赋值',
    color: 'bg-teal-500/20 text-teal-700 dark:text-teal-300',
    cssVar: 'hsl(173 80% 40%)',
  },
  clear_value: {
    type: 'clear_value',
    label: '清空',
    color: 'bg-muted text-muted-foreground',
    cssVar: 'hsl(215 14% 55%)',
  },
  show_option: {
    type: 'show_option',
    label: '显示选项',
    color: 'bg-green-500/20 text-green-700 dark:text-green-300',
    cssVar: 'hsl(142 71% 45%)',
  },
  hide_option: {
    type: 'hide_option',
    label: '隐藏选项',
    color: 'bg-destructive/15 text-destructive',
    cssVar: 'hsl(0 84% 60%)',
  },
}

export const FALLBACK_ACTION_CONFIG: LogicActionConfig = {
  type: 'jump_question', // 虽然业务上不对，但类型要求是 ActionType
  label: '未知',
  color: 'bg-muted text-muted-foreground',
  cssVar: 'hsl(215 14% 55%)',
}

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
interface DailyLimitRule {
  enabled: boolean
  limit: number
  identifyBy: 'ip' | 'device' | 'account' | 'ip_device'
}

interface QuotaRule {
  enabled: boolean
  total: number
  onExceed: 'close' | 'show_message' | 'redirect'
}

interface TimeWindowRule {
  enabled: boolean
  startAt?: string
  endAt?: string
  onExpire: 'show_closed' | 'redirect' | 'hide'
}

interface IpDedupRule {
  enabled: boolean
  limit: number
  onExceed: 'reject' | 'show_message'
}

interface LoginRule {
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
  nodes: QuestionNode[]
  validations: CrossValidation[]
  logic: LogicRule[]
  extensions: Record<string, unknown>
}

// 拖拽数据载荷模型
export type DragPayload =
  | { type: 'NEW_QUESTION'; questionType: NodeType }
  | { type: 'MOVE_NODE'; nodeId: string }
