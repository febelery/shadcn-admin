import { describe, expect, it } from 'vitest'
import { parseRichTextContent } from './rich-text'

describe('rich text contract', () => {
  it('accepts the controlled StarterKit document shape', () => {
    const content = parseRichTextContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '说明文字' }],
        },
      ],
    })

    expect(content).toMatchObject({ type: 'doc' })
  })

  it('rejects arbitrary nodes and non-document roots', () => {
    expect(() => parseRichTextContent({ type: 'paragraph' })).toThrow()
    expect(() =>
      parseRichTextContent({
        type: 'doc',
        content: [{ type: 'script', attrs: { source: 'alert(1)' } }],
      })
    ).toThrow()
  })
})
