'use client'
import { useBuilderStore } from '@/features/survey-builder/store'
import type { QuestionNode } from '@/features/survey-builder/types'

export function InlineRichTextEditor({ node }: { node: QuestionNode }) {
  const updateNode = useBuilderStore((s) => s.updateNode)
  return (
    <textarea
      className='text-foreground placeholder:text-muted-foreground/40 field-sizing-content min-h-[3em] w-full resize-none border-none bg-transparent p-0 text-sm leading-relaxed ring-0 outline-none focus:outline-none'
      value={node.title ?? ''}
      rows={3}
      placeholder='输入说明内容，支持换行等格式...'
      onChange={(e) => updateNode(node.id, { title: e.target.value })}
      autoFocus
    />
  )
}
