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
import {
  QUESTION_DEFINITIONS,
  getQuestionDefinition,
  type QuestionCategory,
} from '../core/question-definitions'
import type { QuestionElement, QuestionType } from '../core/types'

export const QUESTION_CATEGORIES = [
  '选择',
  '输入',
  '评价',
  '结构',
  '媒体',
  '布局',
] as const

const ICONS: Record<QuestionType, LucideIcon> = {
  single_choice: CircleDot,
  multiple_choice: CheckSquare,
  dropdown: ChevronDown,
  ranking: ListOrdered,
  matrix_single: Table,
  matrix_multiple: Grid3x3,
  cascader: GitBranch,
  text: Type,
  textarea: AlignLeft,
  number: Hash,
  email: Mail,
  phone: Phone,
  url: Link,
  date: Calendar,
  date_range: Calendar,
  fill_in: TextCursorInput,
  rating: Star,
  slider: SlidersHorizontal,
  nps: Hash,
  likert: Table,
  dynamic_panel: Layers,
  file_upload: FileUp,
  signature: PenLine,
}

export interface QuestionManifest {
  type: QuestionType
  label: string
  category: QuestionCategory
  icon: LucideIcon
  create: () => QuestionElement
}

export const QUESTION_MANIFESTS: QuestionManifest[] = QUESTION_DEFINITIONS.map(
  (definition) => ({
    type: definition.type,
    label: definition.label,
    category: definition.category,
    icon: ICONS[definition.type],
    create: definition.create,
  })
)

const manifestByType = new Map(
  QUESTION_MANIFESTS.map((item) => [item.type, item])
)

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
  return manifestByType.get(type)
}

export function getQuestionTypeLabel(type: QuestionType): string {
  return getQuestionDefinition(type).label
}
