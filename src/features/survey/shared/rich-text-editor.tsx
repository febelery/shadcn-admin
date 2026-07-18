import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Underline,
  Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  EMPTY_RICH_TEXT,
  RICH_TEXT_EXTENSIONS,
  type RichTextContent,
} from '../core/rich-text'

type RichTextEditorProps = {
  content: RichTextContent
  onChange: (content: RichTextContent) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = '输入说明内容…',
  className,
}: RichTextEditorProps) {
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const extensions = useMemo(
    () => [...RICH_TEXT_EXTENSIONS, Placeholder.configure({ placeholder })],
    [placeholder]
  )

  const editor = useEditor({
    extensions,
    content: content ?? EMPTY_RICH_TEXT,
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => {
      onChangeRef.current(nextEditor.getJSON())
    },
  })

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (JSON.stringify(editor.getJSON()) === JSON.stringify(content)) return
    editor.commands.setContent(content ?? EMPTY_RICH_TEXT, {
      emitUpdate: false,
    })
  }, [content, editor])

  if (!editor) return null

  return (
    <div
      className={`border-input bg-background text-foreground overflow-hidden rounded-md border ${className ?? ''}`}
    >
      <div className='bg-muted/20 flex flex-wrap items-center gap-1 border-b p-1'>
        <RichTextToolbarButton
          label='加粗'
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className='size-4' />
        </RichTextToolbarButton>
        <RichTextToolbarButton
          label='斜体'
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className='size-4' />
        </RichTextToolbarButton>
        <RichTextToolbarButton
          label='下划线'
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className='size-4' />
        </RichTextToolbarButton>
        <RichTextToolbarButton
          label='无序列表'
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className='size-4' />
        </RichTextToolbarButton>
        <RichTextToolbarButton
          label='有序列表'
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className='size-4' />
        </RichTextToolbarButton>
        <RichTextToolbarButton
          label='引用'
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className='size-4' />
        </RichTextToolbarButton>
        <span className='bg-border mx-1 h-5 w-px' />
        <RichTextToolbarButton
          label='撤销'
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className='size-4' />
        </RichTextToolbarButton>
        <RichTextToolbarButton
          label='重做'
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className='size-4' />
        </RichTextToolbarButton>
      </div>
      <EditorContent
        editor={editor}
        aria-label={placeholder}
        className='[&_.ProseMirror]:min-h-[96px] [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2 [&_.ProseMirror]:text-sm [&_.ProseMirror]:leading-relaxed [&_.ProseMirror]:outline-none'
      />
    </div>
  )
}

function RichTextToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type='button'
      variant={active ? 'secondary' : 'ghost'}
      size='icon'
      className='size-7'
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
