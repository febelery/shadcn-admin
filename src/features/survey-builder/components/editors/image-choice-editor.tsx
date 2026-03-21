'use client'
import { Plus, Trash2 } from 'lucide-react'
import { useOptionsManager } from '@/features/survey-builder/hooks/use-options-manager'
import type { QuestionNode } from '@/features/survey-builder/types'

export function InlineImageChoiceEditor({ node }: { node: QuestionNode }) {
  const options = node.config.options ?? []
  const { addOption, removeOption, updateLabel } = useOptionsManager(
    node.id,
    options
  )

  return (
    <div className='flex flex-col gap-4' onClick={(e) => e.stopPropagation()}>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        {options.map((opt, i) => (
          <div
            key={opt.id}
            className='group/img-card border-border/40 hover:border-primary/30 bg-muted/5 relative flex flex-col overflow-hidden rounded-xl border transition-all'
          >
            {/* 图片预览占位 */}
            <div className='bg-muted/10 relative flex aspect-4/3 items-center justify-center border-b'>
              {opt.image ? (
                <img
                  src={opt.image}
                  alt={opt.label}
                  className='h-full w-full object-cover'
                />
              ) : (
                <div className='text-muted-foreground/30 flex flex-col items-center gap-1.5'>
                  <Plus className='size-5' />
                  <span className='text-[10px] tracking-tighter uppercase'>
                    上传图片
                  </span>
                </div>
              )}
              {/* 删除选项按钮 */}
              <button
                onClick={() => removeOption(opt.id)}
                className='bg-destructive/10 text-destructive-foreground hover:bg-destructive absolute top-1.5 right-1.5 hidden size-6 items-center justify-center rounded-full shadow-sm transition-all group-hover/img-card:flex'
              >
                <Trash2 className='size-3.5' />
              </button>
            </div>
            {/* 标签输入 */}
            <div className='p-2'>
              <textarea
                className='placeholder:text-muted-foreground/30 focus:bg-primary/5 w-full resize-none border-none bg-transparent p-0 text-center text-xs font-medium ring-0 outline-none'
                value={opt.label}
                placeholder={`选项 ${i + 1}`}
                rows={1}
                onChange={(e) => updateLabel(opt.id, e.target.value)}
              />
            </div>
          </div>
        ))}
        {/* 添加按钮卡片 */}
        <button
          onClick={() => addOption(options.length - 1)}
          className='border-border/30 text-muted-foreground/40 hover:bg-muted/30 hover:text-primary flex aspect-4/3 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all'
        >
          <Plus className='size-6' />
          <span className='text-[10px] font-bold tracking-widest uppercase'>
            添加选项
          </span>
        </button>
      </div>
    </div>
  )
}
