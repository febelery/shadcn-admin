import {
  Circle,
  CheckSquare,
  ChevronDown,
  LayoutGrid,
  ArrowUpDown,
  Image,
  Star,
  Minus,
  BarChart2,
  PenLine,
  SplitSquareHorizontal,
  FileText,
  Paperclip,
  MapPin,
  Calendar,
  Clock,
  Text,
  AlignLeft,
  Hash,
  type LucideIcon,
} from 'lucide-react'
import type { NodeType, QuestionType, LayoutType } from './types'

// 节点工具函数
export const isQuestionNode = (type: NodeType): type is QuestionType =>
  !['divider', 'rich_text'].includes(type)

export const isLayoutNode = (type: NodeType): type is LayoutType =>
  ['divider', 'rich_text'].includes(type)

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
    label: '跳题',
    color: 'bg-blue-500',
    cssVar: '--action-jump',
  },
  show_node: {
    type: 'show_node',
    label: '显示题目',
    color: 'bg-green-500',
    cssVar: '--action-show',
  },
  hide_node: {
    type: 'hide_node',
    label: '隐藏题目',
    color: 'bg-red-500',
    cssVar: '--action-hide',
  },
}

export const FALLBACK_ACTION_CONFIG: LogicActionConfig = {
  type: 'unknown',
  label: '未知动作',
  color: 'bg-gray-500',
  cssVar: '--action-unknown',
}

// 题型分类
export const QUESTION_TYPE_CATEGORIES = [
  '选择类',
  '输入类',
  '评价类',
  '媒体',
  '布局',
] as const

export interface QuestionTypeConfig {
  type: NodeType
  label: string
  description: string
  icon: LucideIcon
  category: (typeof QUESTION_TYPE_CATEGORIES)[number]
  defaultConfig?: any
}

export const QUESTION_TYPES: QuestionTypeConfig[] = [
  // 选择类
  {
    type: 'single_choice',
    label: '单选题',
    description: '从多个选项中选择一个',
    icon: Circle,
    category: '选择类',
    defaultConfig: {
      options: [
        { id: '1', label: '选项 1' },
        { id: '2', label: '选项 2' },
      ],
    },
  },
  {
    type: 'multiple_choice',
    label: '多选题',
    description: '可选择一个或多个选项',
    icon: CheckSquare,
    category: '选择类',
    defaultConfig: {
      options: [
        { id: '1', label: '选项 1' },
        { id: '2', label: '选项 2' },
      ],
    },
  },
  {
    type: 'dropdown',
    label: '下拉选择',
    description: '下拉菜单形式选择',
    icon: ChevronDown,
    category: '选择类',
    defaultConfig: {
      options: [
        { id: '1', label: '选项 1' },
        { id: '2', label: '选项 2' },
      ],
    },
  },
  {
    type: 'image_choice',
    label: '图片选择',
    description: '可视化图片选项',
    icon: Image,
    category: '选择类',
  },
  {
    type: 'ranking',
    label: '排序',
    description: '拖拽选项进行排序',
    icon: ArrowUpDown,
    category: '选择类',
  },
  {
    type: 'matrix_single',
    label: '矩阵单选',
    description: '表格形式多维评估',
    icon: LayoutGrid,
    category: '选择类',
    defaultConfig: {
      rows: [{ id: '1', label: '维度 1' }],
      columns: [{ id: '1', label: '选项 1' }],
    },
  },
  {
    type: 'matrix_multiple',
    label: '矩阵多选',
    description: '多维多选评估',
    icon: LayoutGrid,
    category: '选择类',
    defaultConfig: {
      rows: [{ id: '1', label: '维度 1' }],
      columns: [{ id: '1', label: '选项 1' }],
    },
  },

  // 输入类
  {
    type: 'text',
    label: '单行输入',
    description: '简短文本回答',
    icon: Text,
    category: '输入类',
  },
  {
    type: 'textarea',
    label: '多行输入',
    description: '较长文本内容',
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
    description: '1–5 星 or 自定义',
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

  // 媒体 / 布局
  {
    type: 'file_upload',
    label: '文件上传',
    description: '上传附件',
    icon: Paperclip,
    category: '媒体',
  },
  {
    type: 'geo_location',
    label: '地理位置',
    description: '地图选点',
    icon: MapPin,
    category: '媒体',
  },
  {
    type: 'signature',
    label: '电子签名',
    description: '手绘签名',
    icon: PenLine,
    category: '媒体',
  },
  {
    type: 'divider',
    label: '分割线',
    description: '视觉分隔',
    icon: SplitSquareHorizontal,
    category: '布局',
  },
  {
    type: 'rich_text',
    label: '说明块',
    description: '富文本说明',
    icon: FileText,
    category: '布局',
  },
]

export const QUESTION_TYPE_MAP = Object.fromEntries(
  QUESTION_TYPES.map((t) => [t.type, t])
) as Record<NodeType, QuestionTypeConfig>
