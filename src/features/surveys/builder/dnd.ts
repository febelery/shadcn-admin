import type { QuestionType } from '../core/types'

export const PALETTE_DRAG = 'palette-question'
export const WORKSPACE_DROP = 'workspace-drop'

export type PaletteDragData = {
  type: typeof PALETTE_DRAG
  questionType?: QuestionType
  layoutType?: 'divider' | 'html_block'
}

export type WorkspaceDropData = {
  type: typeof WORKSPACE_DROP
  sectionId: string
}

/** 题目之间的插入投放位 */
export const INSERT_DROP = 'workspace-insert'

export type InsertDropData = {
  type: typeof INSERT_DROP
  sectionId: string
  index: number
}
