import { describe, expect, it } from 'vitest'
import { createEmptySurvey } from '../../core/document-factory'
import { createBuilderStore } from './store'

describe('Builder rich text interface', () => {
  it('creates and updates structured content without exposing element fields', () => {
    const document = createEmptySurvey()
    const store = createBuilderStore(document)
    store.getState().addLayout('rich_text')

    const block = store.getState().document.elements[0]
    expect(block).toMatchObject({ kind: 'rich_text', content: { type: 'doc' } })

    store.getState().updateRichTextContent(block.id, {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '更新后的说明' }],
        },
      ],
    })

    expect(store.getState().document.elements[0]).toMatchObject({
      kind: 'rich_text',
      content: {
        content: [
          {
            content: [{ text: '更新后的说明' }],
          },
        ],
      },
    })

    expect(() =>
      store.getState().updateRichTextContent(block.id, {
        type: 'script',
      })
    ).toThrow()
  })
})
