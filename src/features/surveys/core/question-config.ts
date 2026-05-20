import type {
  CascaderNode,
  ChoiceOption,
  LikertStatement,
  MatrixColumn,
  MatrixRow,
  QuestionType,
  SurveyElement,
} from './types'

/** 选择类题型共用 config 字段 */
export interface ChoiceQuestionConfig {
  options?: ChoiceOption[]
  allowOther?: boolean
  otherLabel?: string
  otherPlaceholder?: string
  randomizeOptions?: boolean
  optionLayout?: 'vertical' | 'horizontal'
  minSelect?: number
  maxSelect?: number
}

export interface MatrixQuestionConfig {
  rows?: MatrixRow[]
  columns?: MatrixColumn[]
}

export interface TextInputQuestionConfig {
  placeholder?: string
  minLength?: number
  maxLength?: number
  textareaRows?: number
}

export interface RatingQuestionConfig {
  starCount?: number
}

export interface SliderQuestionConfig {
  minValue?: number
  maxValue?: number
  step?: number
}

export interface NpsQuestionConfig {
  scaleMin?: number
  scaleMax?: number
  npsLeftLabel?: string
  npsRightLabel?: string
}

export interface LikertQuestionConfig {
  statements?: LikertStatement[]
  scaleMin?: number
  scaleMax?: number
}

export interface CascaderQuestionConfig {
  cascaderOptions?: CascaderNode[]
}

export interface DateQuestionConfig {
  dateMode?: 'date' | 'datetime'
  minDate?: string
  maxDate?: string
}

export interface FileUploadQuestionConfig {
  acceptTypes?: string[]
  maxCount?: number
  maxSize?: number
}

export interface DynamicPanelQuestionConfig {
  templateElements?: SurveyElement[]
  minItems?: number
  maxItems?: number
  addLabel?: string
}

/** 按题型划分的 config 形态（编译期约束扩展点） */
export type QuestionConfigByType = {
  single_choice: ChoiceQuestionConfig
  multiple_choice: ChoiceQuestionConfig
  dropdown: ChoiceQuestionConfig
  ranking: Pick<
    ChoiceQuestionConfig,
    'options' | 'randomizeOptions' | 'optionLayout'
  >
  matrix_single: MatrixQuestionConfig
  matrix_multiple: MatrixQuestionConfig
  cascader: CascaderQuestionConfig
  text: TextInputQuestionConfig
  textarea: TextInputQuestionConfig
  number: TextInputQuestionConfig
  email: TextInputQuestionConfig
  phone: TextInputQuestionConfig
  url: TextInputQuestionConfig
  date: DateQuestionConfig
  date_range: DateQuestionConfig
  fill_in: Record<string, never>
  rating: RatingQuestionConfig
  slider: SliderQuestionConfig
  nps: NpsQuestionConfig
  likert: LikertQuestionConfig
  dynamic_panel: DynamicPanelQuestionConfig
  file_upload: FileUploadQuestionConfig
  signature: Record<string, never>
  divider: Record<string, never>
  html_block: Record<string, never>
}

export type QuestionConfigFor<T extends QuestionType> = QuestionConfigByType[T]
