import type { QuestionConfig, QuestionElement, QuestionType } from './types'

export type QuestionCategory = '选择' | '输入' | '评价' | '结构' | '媒体'
export type QuestionFamily =
  | 'choice'
  | 'matrix'
  | 'text'
  | 'number'
  | 'date'
  | 'special'
export type OperatorProfile =
  | 'choice'
  | 'multi'
  | 'text'
  | 'number'
  | 'date'
  | 'none'

export interface QuestionDefinition<Type extends QuestionType = QuestionType> {
  type: Type
  label: string
  category: QuestionCategory
  family: QuestionFamily
  inspectorTitle: string
  inspectorDefaultOpen: boolean
  operatorProfile: OperatorProfile
  ruleSource: boolean
  ruleSourceUnavailableReason?: string
  create: () => QuestionElement<Type>
}

function baseQuestion<Type extends QuestionType>(
  type: Type,
  title: string,
  config: QuestionConfig<Type>
): QuestionElement<Type> {
  return {
    kind: 'question',
    id: crypto.randomUUID(),
    type,
    title,
    required: false,
    config,
  } as QuestionElement<Type>
}

const defaultOptions = () => [
  { id: crypto.randomUUID(), label: '选项 1' },
  { id: crypto.randomUUID(), label: '选项 2' },
]

const unsupported = {
  ranking: '排序题答案结构复杂，当前规则编辑器不支持。',
  matrix: '矩阵题需要按行列单元格建条件，当前规则编辑器不支持。',
  cascader: '级联题需要按层级路径建条件，当前规则编辑器不支持。',
  likert: '李克特量表包含多条陈述，当前规则编辑器不支持。',
  dynamic: '重复组包含多份子表单，不能作为单一条件题。',
  upload: '文件上传题不能作为条件题。',
  signature: '签名题不能作为条件题。',
  fill: '填空题包含多个空位，当前规则编辑器不支持。',
}

export const QUESTION_DEFINITIONS = [
  {
    type: 'single_choice',
    label: '单选题',
    category: '选择',
    family: 'choice',
    inspectorTitle: '选项',
    inspectorDefaultOpen: true,
    operatorProfile: 'choice',
    ruleSource: true,
    create: () =>
      baseQuestion('single_choice', '单选题', { options: defaultOptions() }),
  },
  {
    type: 'multiple_choice',
    label: '多选题',
    category: '选择',
    family: 'choice',
    inspectorTitle: '选项',
    inspectorDefaultOpen: true,
    operatorProfile: 'multi',
    ruleSource: true,
    create: () =>
      baseQuestion('multiple_choice', '多选题', { options: defaultOptions() }),
  },
  {
    type: 'dropdown',
    label: '下拉选择',
    category: '选择',
    family: 'choice',
    inspectorTitle: '选项',
    inspectorDefaultOpen: true,
    operatorProfile: 'choice',
    ruleSource: true,
    create: () =>
      baseQuestion('dropdown', '下拉题', { options: defaultOptions() }),
  },
  {
    type: 'ranking',
    label: '排序题',
    category: '选择',
    family: 'choice',
    inspectorTitle: '选项',
    inspectorDefaultOpen: true,
    operatorProfile: 'none',
    ruleSource: false,
    ruleSourceUnavailableReason: unsupported.ranking,
    create: () =>
      baseQuestion('ranking', '排序题', { options: defaultOptions() }),
  },
  {
    type: 'matrix_single',
    label: '矩阵单选',
    category: '选择',
    family: 'matrix',
    inspectorTitle: '矩阵',
    inspectorDefaultOpen: true,
    operatorProfile: 'none',
    ruleSource: false,
    ruleSourceUnavailableReason: unsupported.matrix,
    create: () =>
      baseQuestion('matrix_single', '矩阵单选题', {
        rows: [{ id: crypto.randomUUID(), label: '行 1' }],
        columns: defaultOptions(),
      }),
  },
  {
    type: 'matrix_multiple',
    label: '矩阵多选',
    category: '选择',
    family: 'matrix',
    inspectorTitle: '矩阵',
    inspectorDefaultOpen: true,
    operatorProfile: 'none',
    ruleSource: false,
    ruleSourceUnavailableReason: unsupported.matrix,
    create: () =>
      baseQuestion('matrix_multiple', '矩阵多选题', {
        rows: [{ id: crypto.randomUUID(), label: '行 1' }],
        columns: defaultOptions(),
      }),
  },
  {
    type: 'cascader',
    label: '级联选择',
    category: '选择',
    family: 'special',
    inspectorTitle: '级联选项',
    inspectorDefaultOpen: false,
    operatorProfile: 'none',
    ruleSource: false,
    ruleSourceUnavailableReason: unsupported.cascader,
    create: () =>
      baseQuestion('cascader', '级联选择题', {
        placeholder: '请选择',
        cascaderOptions: [
          {
            id: crypto.randomUUID(),
            label: '一级',
            children: [{ id: crypto.randomUUID(), label: '二级' }],
          },
        ],
      }),
  },
  {
    type: 'text',
    label: '单行文本',
    category: '输入',
    family: 'text',
    inspectorTitle: '文本输入',
    inspectorDefaultOpen: false,
    operatorProfile: 'text',
    ruleSource: true,
    create: () => baseQuestion('text', '单行文本', { placeholder: '请输入' }),
  },
  {
    type: 'textarea',
    label: '多行文本',
    category: '输入',
    family: 'text',
    inspectorTitle: '文本输入',
    inspectorDefaultOpen: false,
    operatorProfile: 'text',
    ruleSource: true,
    create: () =>
      baseQuestion('textarea', '多行文本', { placeholder: '请输入' }),
  },
  {
    type: 'number',
    label: '数字',
    category: '输入',
    family: 'number',
    inspectorTitle: '数字',
    inspectorDefaultOpen: false,
    operatorProfile: 'number',
    ruleSource: true,
    create: () => baseQuestion('number', '数字题', {}),
  },
  {
    type: 'email',
    label: '邮箱',
    category: '输入',
    family: 'text',
    inspectorTitle: '文本输入',
    inspectorDefaultOpen: false,
    operatorProfile: 'text',
    ruleSource: true,
    create: () => baseQuestion('email', '邮箱', {}),
  },
  {
    type: 'phone',
    label: '手机号',
    category: '输入',
    family: 'text',
    inspectorTitle: '文本输入',
    inspectorDefaultOpen: false,
    operatorProfile: 'text',
    ruleSource: true,
    create: () => baseQuestion('phone', '手机号', {}),
  },
  {
    type: 'url',
    label: '网址',
    category: '输入',
    family: 'text',
    inspectorTitle: '文本输入',
    inspectorDefaultOpen: false,
    operatorProfile: 'text',
    ruleSource: true,
    create: () => baseQuestion('url', '网址', {}),
  },
  {
    type: 'date',
    label: '日期',
    category: '输入',
    family: 'date',
    inspectorTitle: '日期',
    inspectorDefaultOpen: false,
    operatorProfile: 'date',
    ruleSource: true,
    create: () => baseQuestion('date', '日期', {}),
  },
  {
    type: 'date_range',
    label: '日期范围',
    category: '输入',
    family: 'date',
    inspectorTitle: '日期',
    inspectorDefaultOpen: false,
    operatorProfile: 'none',
    ruleSource: false,
    create: () => baseQuestion('date_range', '日期范围', {}),
  },
  {
    type: 'fill_in',
    label: '填空题',
    category: '输入',
    family: 'special',
    inspectorTitle: '填空',
    inspectorDefaultOpen: false,
    operatorProfile: 'none',
    ruleSource: false,
    ruleSourceUnavailableReason: unsupported.fill,
    create: () => baseQuestion('fill_in', '姓名___，年龄___', {}),
  },
  {
    type: 'rating',
    label: '星级评分',
    category: '评价',
    family: 'number',
    inspectorTitle: '评分',
    inspectorDefaultOpen: false,
    operatorProfile: 'number',
    ruleSource: true,
    create: () => baseQuestion('rating', '请评分', { starCount: 5 }),
  },
  {
    type: 'slider',
    label: '滑块',
    category: '评价',
    family: 'number',
    inspectorTitle: '滑块',
    inspectorDefaultOpen: false,
    operatorProfile: 'number',
    ruleSource: true,
    create: () =>
      baseQuestion('slider', '滑块题', { minValue: 0, maxValue: 100, step: 1 }),
  },
  {
    type: 'nps',
    label: 'NPS 净推荐值',
    category: '评价',
    family: 'number',
    inspectorTitle: 'NPS',
    inspectorDefaultOpen: false,
    operatorProfile: 'number',
    ruleSource: true,
    create: () =>
      baseQuestion('nps', '您有多大可能向他人推荐我们？', {
        npsLeftLabel: '完全不可能',
        npsRightLabel: '非常可能',
      }),
  },
  {
    type: 'likert',
    label: '李克特量表',
    category: '评价',
    family: 'special',
    inspectorTitle: '量表',
    inspectorDefaultOpen: false,
    operatorProfile: 'none',
    ruleSource: false,
    ruleSourceUnavailableReason: unsupported.likert,
    create: () =>
      baseQuestion('likert', '李克特量表', {
        statements: [{ id: crypto.randomUUID(), label: '陈述 1' }],
        scaleMin: 1,
        scaleMax: 5,
      }),
  },
  {
    type: 'dynamic_panel',
    label: '重复组',
    category: '结构',
    family: 'special',
    inspectorTitle: '自增面板',
    inspectorDefaultOpen: false,
    operatorProfile: 'none',
    ruleSource: false,
    ruleSourceUnavailableReason: unsupported.dynamic,
    create: () =>
      baseQuestion('dynamic_panel', '重复填写组', {
        minItems: 1,
        maxItems: 5,
        addLabel: '添加一项',
        templateElements: [],
      }),
  },
  {
    type: 'file_upload',
    label: '文件上传',
    category: '媒体',
    family: 'special',
    inspectorTitle: '文件上传',
    inspectorDefaultOpen: false,
    operatorProfile: 'none',
    ruleSource: false,
    ruleSourceUnavailableReason: unsupported.upload,
    create: () =>
      baseQuestion('file_upload', '上传文件', { maxCount: 3, maxSize: 10 }),
  },
  {
    type: 'signature',
    label: '手写签名',
    category: '媒体',
    family: 'special',
    inspectorTitle: '签名',
    inspectorDefaultOpen: false,
    operatorProfile: 'none',
    ruleSource: false,
    ruleSourceUnavailableReason: unsupported.signature,
    create: () => baseQuestion('signature', '签名', {}),
  },
] as const satisfies readonly QuestionDefinition[]

const definitionByType = new Map(
  QUESTION_DEFINITIONS.map((item) => [item.type, item])
)

export function getQuestionDefinition<Type extends QuestionType>(
  type: Type
): QuestionDefinition<Type> {
  const definition = definitionByType.get(type)
  if (!definition) throw new Error(`未注册题型：${type}`)
  return definition as QuestionDefinition<Type>
}

export function getQuestionTypeLabel(type: QuestionType): string {
  return getQuestionDefinition(type).label
}
