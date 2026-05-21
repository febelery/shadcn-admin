import type { QuestionType } from '../types'

export const PALETTE_DRAG = 'palette-question'
export const WORKSPACE_DROP = 'workspace-drop'
export const INSERT_DROP = 'workspace-insert'

export type PaletteDragData = {
  type: typeof PALETTE_DRAG
  questionType?: QuestionType
  layoutType?: 'divider' | 'html_block'
}

export type InsertDropData = {
  type: typeof INSERT_DROP
  sectionId: string
  index: number
}
