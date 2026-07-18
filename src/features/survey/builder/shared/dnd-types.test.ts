import { describe, expect, it } from 'vitest'
import {
  INSERT_DROP,
  PALETTE_ITEM_DRAG,
  isInsertDropData,
  isPaletteItemDragData,
} from './dnd-types'

describe('builder drag data contract', () => {
  it('accepts complete question and layout palette identities', () => {
    expect(
      isPaletteItemDragData({
        type: PALETTE_ITEM_DRAG,
        kind: 'question',
        questionType: 'single_choice',
      })
    ).toBe(true)
    expect(
      isPaletteItemDragData({
        type: PALETTE_ITEM_DRAG,
        kind: 'layout',
        layoutType: 'rich_text',
      })
    ).toBe(true)
  })

  it('rejects incomplete and unknown palette identities', () => {
    expect(
      isPaletteItemDragData({ type: PALETTE_ITEM_DRAG, kind: 'question' })
    ).toBe(false)
    expect(
      isPaletteItemDragData({
        type: PALETTE_ITEM_DRAG,
        kind: 'question',
        questionType: 'unknown',
      })
    ).toBe(false)
    expect(
      isPaletteItemDragData({
        type: PALETTE_ITEM_DRAG,
        kind: 'layout',
        layoutType: 'section',
      })
    ).toBe(false)
  })

  it('accepts only nonnegative integer insertion positions', () => {
    expect(isInsertDropData({ type: INSERT_DROP, index: 0 })).toBe(true)
    expect(isInsertDropData({ type: INSERT_DROP, index: -1 })).toBe(false)
    expect(isInsertDropData({ type: INSERT_DROP, index: 1.5 })).toBe(false)
  })
})
