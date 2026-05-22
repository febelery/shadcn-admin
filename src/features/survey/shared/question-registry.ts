import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  CircleDot,
  FileUp,
  GitBranch,
  Grid3x3,
  Hash,
  Layers,
  Link,
  ListOrdered,
  Mail,
  PenLine,
  Phone,
  SeparatorHorizontal,
  SlidersHorizontal,
  Star,
  Table,
  TextCursorInput,
  Type,
  type LucideIcon,
} from 'lucide-react'
import { createQuestionId } from '../core/schema-defaults'
import type { QuestionElement, QuestionType } from '../core/types'

export const QUESTION_CATEGORIES = [
  '选择',
  '输入',
  '评价',
  '结构',
  '媒体',
  '布局',
] as const

type QuestionCategory = (typeof QUESTION_CATEGORIES)[number]

export interface QuestionManifest {
  type: QuestionType
  label: string
  category: QuestionCategory
  icon: LucideIcon
  create: () => QuestionElement
}

function baseQuestion(
  type: QuestionType,
  title: string,
  config: QuestionElement['config'] = {}
): QuestionElement {
  return {
    kind: 'question',
    id: createQuestionId(),
    type,
    title,
    required: false,
    config,
  }
}

const defaultOptions = () => [
  { id: createQuestionId(), label: '选项 1' },
  { id: createQuestionId(), label: '选项 2' },
]

export const QUESTION_MANIFESTS: QuestionManifest[] = [
  {
    type: 'single_choice',
    label: '单选题',
    category: '选择',
    icon: CircleDot,
    create: () =>
      baseQuestion('single_choice', '单选题', { options: defaultOptions() }),
  },
  {
    type: 'multiple_choice',
    label: '多选题',
    category: '选择',
    icon: CheckSquare,
    create: () =>
      baseQuestion('multiple_choice', '多选题', { options: defaultOptions() }),
  },
  {
    type: 'dropdown',
    label: '下拉选择',
    category: '选择',
    icon: ChevronDown,
    create: () =>
      baseQuestion('dropdown', '下拉题', { options: defaultOptions() }),
  },
  {
    type: 'ranking',
    label: '排序题',
    category: '选择',
    icon: ListOrdered,
    create: () =>
      baseQuestion('ranking', '排序题', { options: defaultOptions() }),
  },
  {
    type: 'matrix_single',
    label: '矩阵单选',
    category: '选择',
    icon: Table,
    create: () =>
      baseQuestion('matrix_single', '矩阵单选题', {
        rows: [{ id: createQuestionId(), label: '行 1' }],
        columns: defaultOptions(),
      }),
  },
  {
    type: 'matrix_multiple',
    label: '矩阵多选',
    category: '选择',
    icon: Grid3x3,
    create: () =>
      baseQuestion('matrix_multiple', '矩阵多选题', {
        rows: [{ id: createQuestionId(), label: '行 1' }],
        columns: defaultOptions(),
      }),
  },
  {
    type: 'cascader',
    label: '级联选择',
    category: '选择',
    icon: GitBranch,
    create: () =>
      baseQuestion('cascader', '级联选择题', {
        placeholder: '请选择',
        cascaderOptions: [
          {
            id: createQuestionId(),
            label: '一级',
            children: [{ id: createQuestionId(), label: '二级' }],
          },
        ],
      }),
  },
  {
    type: 'text',
    label: '单行文本',
    category: '输入',
    icon: Type,
    create: () => baseQuestion('text', '单行文本', { placeholder: '请输入' }),
  },
  {
    type: 'textarea',
    label: '多行文本',
    category: '输入',
    icon: AlignLeft,
    create: () =>
      baseQuestion('textarea', '多行文本', { placeholder: '请输入' }),
  },
  {
    type: 'number',
    label: '数字',
    category: '输入',
    icon: Hash,
    create: () => baseQuestion('number', '数字题'),
  },
  {
    type: 'email',
    label: '邮箱',
    category: '输入',
    icon: Mail,
    create: () => baseQuestion('email', '邮箱'),
  },
  {
    type: 'phone',
    label: '手机号',
    category: '输入',
    icon: Phone,
    create: () => baseQuestion('phone', '手机号'),
  },
  {
    type: 'url',
    label: '网址',
    category: '输入',
    icon: Link,
    create: () => baseQuestion('url', '网址'),
  },
  {
    type: 'date',
    label: '日期',
    category: '输入',
    icon: Calendar,
    create: () => baseQuestion('date', '日期'),
  },
  {
    type: 'date_range',
    label: '日期范围',
    category: '输入',
    icon: Calendar,
    create: () => baseQuestion('date_range', '日期范围'),
  },
  {
    type: 'fill_in',
    label: '填空题',
    category: '输入',
    icon: TextCursorInput,
    create: () => baseQuestion('fill_in', '姓名（）年龄（）'),
  },
  {
    type: 'rating',
    label: '星级评分',
    category: '评价',
    icon: Star,
    create: () => baseQuestion('rating', '请评分', { starCount: 5 }),
  },
  {
    type: 'slider',
    label: '滑块',
    category: '评价',
    icon: SlidersHorizontal,
    create: () =>
      baseQuestion('slider', '滑块题', { minValue: 0, maxValue: 100, step: 1 }),
  },
  {
    type: 'nps',
    label: 'NPS 净推荐值',
    category: '评价',
    icon: Hash,
    create: () =>
      baseQuestion('nps', '您有多大可能向他人推荐我们？', {
        scaleMin: 0,
        scaleMax: 10,
        npsLeftLabel: '完全不可能',
        npsRightLabel: '非常可能',
      }),
  },
  {
    type: 'likert',
    label: '李克特量表',
    category: '评价',
    icon: Table,
    create: () =>
      baseQuestion('likert', '李克特量表', {
        statements: [{ id: createQuestionId(), label: '陈述 1' }],
        scaleMin: 1,
        scaleMax: 5,
      }),
  },
  {
    type: 'dynamic_panel',
    label: '重复组',
    category: '结构',
    icon: Layers,
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
    icon: FileUp,
    create: () =>
      baseQuestion('file_upload', '上传文件', { maxCount: 3, maxSize: 10 }),
  },
  {
    type: 'signature',
    label: '手写签名',
    category: '媒体',
    icon: PenLine,
    create: () => baseQuestion('signature', '签名'),
  },
]

export const LAYOUT_MANIFESTS = [
  {
    type: 'divider' as const,
    label: '分割线',
    category: '布局' as const,
    icon: SeparatorHorizontal,
  },
  {
    type: 'html_block' as const,
    label: '富文本说明',
    category: '布局' as const,
    icon: AlignLeft,
  },
]

export function getQuestionManifest(type: QuestionType) {
  return QUESTION_MANIFESTS.find((m) => m.type === type)
}

export function getQuestionTypeLabel(type: QuestionType): string {
  return getQuestionManifest(type)?.label ?? type
}
