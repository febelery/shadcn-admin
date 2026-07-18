import { getSchema, type JSONContent } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

export type RichTextContent = JSONContent

export const RICH_TEXT_EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  }),
]

const richTextSchema = getSchema(RICH_TEXT_EXTENSIONS)

export const EMPTY_RICH_TEXT: RichTextContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

export function parseRichTextContent(input: unknown): RichTextContent {
  const node = richTextSchema.nodeFromJSON(input)
  if (node.type.name !== 'doc') {
    throw new Error('富文本内容根节点必须是 doc')
  }
  return node.toJSON() as RichTextContent
}
