import { Minus } from 'lucide-react'
import type { QuestionNode } from '../types'
import type { QuestionTypeDefinition } from './index'

/**
 * 3. 导出定义
 */
export const fillInType: QuestionTypeDefinition = {
  type: 'fill_in',
  meta: {
    label: '填空',
    description: '中内置填空，支持多空采集',
    icon: Minus,
    category: '输入类',
  },
  create: () => ({
    type: 'fill_in',
    title: '请在 () 内填入您认为正确的答案',
    required: false,
    config: {},
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    const parts = node.title.split(/(\(\)|（）|__+|＿＿+)/)
    return (
      <div className='text-muted-foreground p-4 text-sm leading-relaxed font-medium opacity-70'>
        {parts.map((p, i) =>
          /(\(\)|（）|__+|＿＿+)/.test(p) ? (
            <span
              key={i}
              className='bg-primary/5 border-primary/30 mx-1 inline-block h-5 w-12 translate-y-1 rounded-t-sm border-b-2'
            />
          ) : (
            <span key={i}>{p}</span>
          )
        )}
      </div>
    )
  },
  configPanel: function ConfigPanel() {
    return (
      <div className='border-border/40 text-muted-foreground/50 border-t px-4 py-8 text-center font-sans italic'>
        <p className='text-[10px] font-bold tracking-widest uppercase'>
          填空题设置
        </p>
        <p className='mt-2 text-[11px] leading-relaxed'>
          填空题无需额外配置。
          <br />
          在题目标题中输入 () 或 __ <br />
          系统将自动识别空位。
        </p>
      </div>
    )
  },
  capabilities: {
    valueType: 'string',
    operators: ['eq', 'neq', 'contains', 'is_empty', 'is_not_empty'],
  },
}
