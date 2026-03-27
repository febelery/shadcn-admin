import { FileText } from 'lucide-react'
import type { QuestionNode } from '../types'
import { defineQuestion, type QuestionComponentProps } from './index'

/**
 * 3. 导出定义
 */
export const richTextType = defineQuestion({
  type: 'rich_text',
  meta: {
    label: '说明块',
    description: '富文本说明内容',
    icon: FileText,
    category: '布局',
  },
  features: {
    hasTitle: true,
    hasRequired: false,
    hasValidation: false,
  },
  create: () => ({
    type: 'rich_text',
    title: '说明标题',
    description: '此处输入详细的说明文字...',
    required: false,
    config: {},
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    return (
      <div className='flex flex-col gap-2 p-4 font-sans opacity-80'>
        <h4 className='text-foreground/80 text-sm font-bold'>
          {node.title || '说明标题'}
        </h4>
        <p className='text-muted-foreground text-xs leading-relaxed'>
          {node.description}
        </p>
      </div>
    )
  },
  configPanel: function ConfigPanel() {
    return (
      <div className='p-6 text-center font-sans'>
        <p className='text-muted-foreground/50 mb-1 text-[10px] font-bold tracking-widest uppercase'>
          说明块配置
        </p>
        <p className='text-muted-foreground text-[11px] leading-relaxed italic'>
          说明块主要用于展示文本。
          <br />
          请直接在上方“题目标题”与“描述”处输入内容。
        </p>
      </div>
    )
  },
  editor: function Editor({ node, onNodeChange }: QuestionComponentProps) {
    return (
      <textarea
        className='text-foreground placeholder:text-muted-foreground/40 field-sizing-content min-h-[3em] w-full resize-none border-none bg-transparent p-0 font-sans text-sm leading-relaxed shadow-none ring-0 outline-none focus:outline-none'
        value={node.title ?? ''}
        rows={3}
        placeholder='输入说明内容，支持换行等格式...'
        onChange={(e) => onNodeChange({ title: e.target.value })}
        autoFocus
      />
    )
  },
  capabilities: {
    valueType: 'none',
    operators: [],
  },
})
