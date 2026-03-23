import { SplitSquareHorizontal } from 'lucide-react'
import type { QuestionTypeDefinition } from './index'

/**
 * 3. 导出定义
 */
export const dividerType: QuestionTypeDefinition = {
  type: 'divider',
  meta: {
    label: '分割线',
    description: '视觉分隔线',
    icon: SplitSquareHorizontal,
    category: '布局',
  },
  create: () => ({
    type: 'divider',
    title: '', // 分割线通常不需要标题
    required: false,
    config: {},
  }),
  preview: function Preview() {
    return (
      <div className='flex items-center gap-4 px-4 py-6 opacity-40'>
        <div className='bg-border h-px flex-1' />
        <SplitSquareHorizontal className='text-muted-foreground h-3 w-3' />
        <div className='bg-border h-px flex-1' />
      </div>
    )
  },
  configPanel: function ConfigPanel() {
    return (
      <div className='border-border/40 border-t p-8 text-center'>
        <p className='text-muted-foreground font-sans text-xs italic'>
          分割线作为视觉辅助，无额外业务配置。
        </p>
      </div>
    )
  },
  capabilities: {
    valueType: 'none',
    operators: [],
  },
}
