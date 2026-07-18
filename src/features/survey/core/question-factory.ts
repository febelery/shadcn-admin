import type { QuestionConfig, QuestionElement, QuestionType } from './types'

type QuestionFactoryMap = {
  [Type in QuestionType]: () => QuestionElement<Type>
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

const QUESTION_FACTORIES: QuestionFactoryMap = {
  single_choice: () =>
    baseQuestion('single_choice', '单选题', { options: defaultOptions() }),
  multiple_choice: () =>
    baseQuestion('multiple_choice', '多选题', { options: defaultOptions() }),
  dropdown: () =>
    baseQuestion('dropdown', '下拉题', { options: defaultOptions() }),
  ranking: () =>
    baseQuestion('ranking', '排序题', { options: defaultOptions() }),
  matrix_single: () =>
    baseQuestion('matrix_single', '矩阵单选题', {
      rows: [{ id: crypto.randomUUID(), label: '行 1' }],
      columns: defaultOptions(),
    }),
  matrix_multiple: () =>
    baseQuestion('matrix_multiple', '矩阵多选题', {
      rows: [{ id: crypto.randomUUID(), label: '行 1' }],
      columns: defaultOptions(),
    }),
  cascader: () =>
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
  text: () => baseQuestion('text', '单行文本', { placeholder: '请输入' }),
  textarea: () =>
    baseQuestion('textarea', '多行文本', { placeholder: '请输入' }),
  number: () => baseQuestion('number', '数字题', {}),
  email: () => baseQuestion('email', '邮箱', {}),
  phone: () => baseQuestion('phone', '手机号', {}),
  url: () => baseQuestion('url', '网址', {}),
  date: () => baseQuestion('date', '日期', {}),
  date_range: () => baseQuestion('date_range', '日期范围', {}),
  fill_in: () => baseQuestion('fill_in', '姓名___，年龄___', {}),
  rating: () => baseQuestion('rating', '请评分', { starCount: 5 }),
  slider: () =>
    baseQuestion('slider', '滑块题', {
      minValue: 0,
      maxValue: 100,
      step: 1,
    }),
  nps: () =>
    baseQuestion('nps', '您有多大可能向他人推荐我们？', {
      npsLeftLabel: '完全不可能',
      npsRightLabel: '非常可能',
    }),
  likert: () =>
    baseQuestion('likert', '李克特量表', {
      statements: [{ id: crypto.randomUUID(), label: '陈述 1' }],
      scaleMin: 1,
      scaleMax: 5,
    }),
  dynamic_panel: () =>
    baseQuestion('dynamic_panel', '重复填写组', {
      minItems: 1,
      maxItems: 5,
      addLabel: '添加一项',
      templateElements: [],
    }),
  file_upload: () =>
    baseQuestion('file_upload', '上传文件', { maxCount: 3, maxSize: 10 }),
  signature: () => baseQuestion('signature', '签名', {}),
}

export function createQuestion<Type extends QuestionType>(
  type: Type
): QuestionElement<Type> {
  return QUESTION_FACTORIES[type]()
}
