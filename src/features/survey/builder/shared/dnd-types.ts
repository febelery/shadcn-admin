import type { QuestionType } from '../../core/types'

export const PALETTE_DRAG = 'palette-question'
export const WORKSPACE_DROP = 'workspace-drop'
export const INSERT_DROP = 'workspace-insert'

export type PaletteDragData = {
  type: typeof PALETTE_DRAG
  questionType?: QuestionType
  layoutType?: 'divider' | 'rich_text'
}

export type InsertDropData = {
  type: typeof INSERT_DROP
  index: number
}
