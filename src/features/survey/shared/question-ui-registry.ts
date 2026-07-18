import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  CircleDot,
  GitBranch,
  Grid3x3,
  Hash,
  Link,
  ListOrdered,
  Mail,
  Phone,
  SeparatorHorizontal,
  SlidersHorizontal,
  Star,
  Table,
  Type,
  type LucideIcon,
} from 'lucide-react'
import {
  QUESTION_TYPES,
  type LayoutElementKind,
  type QuestionType,
} from '../core/types'
import { getQuestionTypeLabel } from './question-type-labels'

export const QUESTION_CATEGORIES = ['选择', '输入', '评价', '布局'] as const

export type QuestionCategory = Exclude<
  (typeof QUESTION_CATEGORIES)[number],
  '布局'
>

export interface QuestionUiManifest {
  kind: 'question'
  type: QuestionType
  label: string
  category: QuestionCategory
  icon: LucideIcon
}

export interface LayoutUiManifest {
  kind: 'layout'
  type: LayoutElementKind
  label: string
  category: '布局'
  icon: LucideIcon
}

const QUESTION_UI_METADATA = {
  single_choice: { category: '选择', icon: CircleDot },
  multiple_choice: { category: '选择', icon: CheckSquare },
  dropdown: { category: '选择', icon: ChevronDown },
  ranking: { category: '选择', icon: ListOrdered },
  matrix_single: { category: '选择', icon: Table },
  matrix_multiple: { category: '选择', icon: Grid3x3 },
  cascader: { category: '选择', icon: GitBranch },
  text: { category: '输入', icon: Type },
  textarea: { category: '输入', icon: AlignLeft },
  number: { category: '输入', icon: Hash },
  email: { category: '输入', icon: Mail },
  phone: { category: '输入', icon: Phone },
  url: { category: '输入', icon: Link },
  date: { category: '输入', icon: Calendar },
  date_range: { category: '输入', icon: Calendar },
  rating: { category: '评价', icon: Star },
  slider: { category: '评价', icon: SlidersHorizontal },
  nps: { category: '评价', icon: Hash },
  likert: { category: '评价', icon: Table },
} satisfies Record<
  QuestionType,
  Omit<QuestionUiManifest, 'kind' | 'type' | 'label'>
>

export const QUESTION_UI_MANIFESTS: QuestionUiManifest[] = QUESTION_TYPES.map(
  (type) => ({
    kind: 'question',
    type,
    label: getQuestionTypeLabel(type),
    ...QUESTION_UI_METADATA[type],
  })
)

export const LAYOUT_MANIFESTS: LayoutUiManifest[] = [
  {
    kind: 'layout',
    type: 'divider',
    label: '分割线',
    category: '布局',
    icon: SeparatorHorizontal,
  },
  {
    kind: 'layout',
    type: 'rich_text',
    label: '富文本说明',
    category: '布局',
    icon: AlignLeft,
  },
]

export function getQuestionUiManifest(type: QuestionType): QuestionUiManifest {
  return {
    kind: 'question',
    type,
    label: getQuestionTypeLabel(type),
    ...QUESTION_UI_METADATA[type],
  }
}
