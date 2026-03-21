import {
  Circle,
  CheckSquare,
  ChevronDown,
  LayoutGrid,
  ArrowUpDown,
  Image,
  Text,
  AlignLeft,
  Hash,
  Minus,
  Calendar,
  Clock,
  Star,
  BarChart2,
  Plus,
  ArrowRight,
  RotateCcw,
  Link2,
  Paperclip,
  MapPin,
  PenLine,
  Square,
  SplitSquareHorizontal,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import type { NodeType, QuestionType, LayoutType } from './types'

// 节点工具函数
export const isQuestionNode = (type: NodeType): type is QuestionType =>
  !['block', 'divider', 'rich_text'].includes(type)

export const isLayoutNode = (type: NodeType): type is LayoutType =>
  ['block', 'divider', 'rich_text'].includes(type)

// 逻辑动作配置
export interface LogicActionConfig {
  type: string
  label: string
  color: string // Tailwind color class
  cssVar: string // CSS variable for canvas
}

export const LOGIC_ACTION_CONFIG: Record<string, LogicActionConfig> = {
  jump_question: {
    type: 'jump_question',
    label: '跳转',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    cssVar: 'var(--color-primary)',
  },
  show: {
    type: 'show',
    label: '显示',
    color:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cssVar: 'var(--color-chart-2)',
  },
  hide: {
    type: 'hide',
    label: '隐藏',
    color: 'bg-secondary text-muted-foreground',
    cssVar: 'var(--color-muted-foreground)',
  },
  end: {
    type: 'end',
    label: '结束',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    cssVar: 'var(--color-destructive)',
  },
  set_required: {
    type: 'set_required',
    label: '必填',
    color:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    cssVar: 'var(--color-chart-4)',
  },
  set_readonly: {
    type: 'set_readonly',
    label: '只读',
    color:
      'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
    cssVar: 'var(--color-chart-3)',
  },
  set_value: {
    type: 'set_value',
    label: '赋值',
    color:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    cssVar: 'var(--color-chart-1)',
  },
  clear_value: {
    type: 'clear_value',
    label: '清空',
    color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400',
    cssVar: 'var(--color-muted-foreground)',
  },
  show_option: {
    type: 'show_option',
    label: '显示选项',
    color:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cssVar: 'var(--color-chart-2)',
  },
  hide_option: {
    type: 'hide_option',
    label: '隐藏选项',
    color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400',
    cssVar: 'var(--color-muted-foreground)',
  },
}

export const FALLBACK_ACTION_CONFIG: LogicActionConfig = {
  type: 'default',
  label: '规则',
  color: 'bg-secondary text-muted-foreground',
  cssVar: 'var(--color-muted-foreground)',
}

export interface QuestionTypeConfig {
  type: NodeType
  label: string
  description: string
  icon: LucideIcon
  category: string
  defaultConfig?: Record<string, unknown>
}

export const QUESTION_TYPE_CATEGORIES = [
  '选择类',
  '输入类',
  '评价类',
  '结构类',
  '媒体 / 布局',
] as const

export const QUESTION_TYPES: QuestionTypeConfig[] = [
  // 选择类
  {
    type: 'single_choice',
    label: '单选题',
    description: '单选，互斥',
    icon: Circle,
    category: '选择类',
    defaultConfig: {
      options: [
        {
          id: crypto.randomUUID(),
          label: '选项 A',
          value: 'option_a',
          order: 0,
        },
        {
          id: crypto.randomUUID(),
          label: '选项 B',
          value: 'option_b',
          order: 1,
        },
      ],
      randomOrder: false,
      allowOther: false,
    },
  },
  {
    type: 'multiple_choice',
    label: '多选题',
    description: '可选多项',
    icon: CheckSquare,
    category: '选择类',
    defaultConfig: {
      options: [
        {
          id: crypto.randomUUID(),
          label: '选项 A',
          value: 'option_a',
          order: 0,
        },
        {
          id: crypto.randomUUID(),
          label: '选项 B',
          value: 'option_b',
          order: 1,
        },
      ],
      randomOrder: false,
      allowOther: false,
    },
  },
  {
    type: 'dropdown',
    label: '下拉选择',
    description: '节省空间',
    icon: ChevronDown,
    category: '选择类',
    defaultConfig: { options: [] },
  },
  {
    type: 'matrix_single',
    label: '矩阵单选',
    description: '行列交叉评价',
    icon: LayoutGrid,
    category: '选择类',
    defaultConfig: {
      rows: [{ id: crypto.randomUUID(), label: '行 1' }],
      columns: [{ id: crypto.randomUUID(), label: '列 1' }],
    },
  },
  {
    type: 'matrix_multiple',
    label: '矩阵多选',
    description: '行列多选',
    icon: LayoutGrid,
    category: '选择类',
    defaultConfig: { rows: [], columns: [] },
  },
  {
    type: 'ranking',
    label: '排序题',
    description: '拖拽排列优先级',
    icon: ArrowUpDown,
    category: '选择类',
    defaultConfig: { options: [] },
  },
  {
    type: 'image_choice',
    label: '图片选择',
    description: '选项为图片',
    icon: Image,
    category: '选择类',
    defaultConfig: { options: [] },
  },
  // 输入类
  {
    type: 'text',
    label: '文本',
    description: '单行文字输入',
    icon: Text,
    category: '输入类',
  },
  {
    type: 'textarea',
    label: '多行文本',
    description: '较长文字回答',
    icon: AlignLeft,
    category: '输入类',
  },
  {
    type: 'number',
    label: '数字',
    description: '数值输入，支持范围校验',
    icon: Hash,
    category: '输入类',
  },
  {
    type: 'fill_in',
    label: '填空',
    description: '行内嵌入式填空',
    icon: Minus,
    category: '输入类',
  },
  {
    type: 'date',
    label: '日期',
    description: '日期选择器',
    icon: Calendar,
    category: '输入类',
  },
  {
    type: 'time',
    label: '时间',
    description: '时间选择器',
    icon: Clock,
    category: '输入类',
  },
  {
    type: 'date_range',
    label: '日期范围',
    description: '起止日期',
    icon: Calendar,
    category: '输入类',
  },
  {
    type: 'time_range',
    label: '时间范围',
    description: '起止时间',
    icon: Clock,
    category: '输入类',
  },
  // 评价类
  {
    type: 'rating',
    label: '评分',
    description: '1–5 星或自定义',
    icon: Star,
    category: '评价类',
    defaultConfig: { starCount: 5 },
  },
  {
    type: 'nps',
    label: 'NPS',
    description: '净推荐值 0–10',
    icon: BarChart2,
    category: '评价类',
  },
  // 结构类
  {
    type: 'group',
    label: '题组',
    description: '多题打包，可整体复用',
    icon: Plus,
    category: '结构类',
  },
  {
    type: 'sub_question',
    label: '子题',
    description: '父题答案触发展开',
    icon: ArrowRight,
    category: '结构类',
  },
  {
    type: 'repeater',
    label: '重复组',
    description: '动态新增行，设上下限',
    icon: RotateCcw,
    category: '结构类',
    defaultConfig: { minRows: 1, maxRows: 5, addLabel: '添加一条' },
  },
  {
    type: 'linked_choice',
    label: '关联题',
    description: '选项来源于另一题',
    icon: Link2,
    category: '结构类',
  },
  // 媒体 / 布局
  {
    type: 'file_upload',
    label: '文件上传',
    description: '上传附件',
    icon: Paperclip,
    category: '媒体 / 布局',
  },
  {
    type: 'geo_location',
    label: '地理位置',
    description: '地图选点',
    icon: MapPin,
    category: '媒体 / 布局',
  },
  {
    type: 'signature',
    label: '电子签名',
    description: '手绘签名',
    icon: PenLine,
    category: '媒体 / 布局',
  },
  {
    type: 'block',
    label: '区块',
    description: '纯布局分组容器',
    icon: Square,
    category: '媒体 / 布局',
  },
  {
    type: 'divider',
    label: '分割线',
    description: '视觉分隔',
    icon: SplitSquareHorizontal,
    category: '媒体 / 布局',
  },
  {
    type: 'rich_text',
    label: '说明块',
    description: '富文本说明',
    icon: FileText,
    category: '媒体 / 布局',
  },
]

export const QUESTION_TYPE_MAP = Object.fromEntries(
  QUESTION_TYPES.map((t) => [t.type, t])
) as Record<NodeType, QuestionTypeConfig>
