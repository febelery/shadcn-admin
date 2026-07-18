import {
  isLayoutElementKind,
  isQuestionType,
  type LayoutElementKind,
  type QuestionType,
} from '../../core/types'

export const PALETTE_ITEM_DRAG = 'palette-item'
export const WORKSPACE_DROP = 'workspace-drop'
export const INSERT_DROP = 'workspace-insert'

export type PaletteItemDragData =
  | {
      type: typeof PALETTE_ITEM_DRAG
      kind: 'question'
      questionType: QuestionType
    }
  | {
      type: typeof PALETTE_ITEM_DRAG
      kind: 'layout'
      layoutType: LayoutElementKind
    }

export type InsertDropData = {
  type: typeof INSERT_DROP
  index: number
}

export function isPaletteItemDragData(
  value: unknown
): value is PaletteItemDragData {
  if (!isRecord(value) || value.type !== PALETTE_ITEM_DRAG) return false
  if (value.kind === 'question') return isQuestionType(value.questionType)
  if (value.kind === 'layout') return isLayoutElementKind(value.layoutType)
  return false
}

export function isInsertDropData(value: unknown): value is InsertDropData {
  return (
    isRecord(value) &&
    value.type === INSERT_DROP &&
    typeof value.index === 'number' &&
    Number.isInteger(value.index) &&
    value.index >= 0
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
