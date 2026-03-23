import { PenLine, Eraser, Image as ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useBuilderStore } from '@/features/survey-builder/store'
import type { QuestionNode } from '../types'
import type { QuestionTypeDefinition } from './index'

/**
 * 3. 导出定义
 */
export const signatureType: QuestionTypeDefinition = {
  type: 'signature',
  meta: {
    label: '电子签名',
    description: '适用于正式授权/确认场景',
    icon: PenLine,
    category: '媒体',
  },
  create: () => ({
    type: 'signature',
    title: '请在上方签名确认',
    required: false,
    config: {
      placeholder: '请在下方签名区签名',
      allowImage: true,
      isBlackOnly: true,
    },
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    return (
      <div className='p-4 opacity-70'>
        <div className='border-muted-foreground/20 bg-muted/10 relative flex min-h-[160px] flex-col items-center justify-center gap-4 rounded-xl border-2 p-8 transition-all'>
          <p className='text-muted-foreground/50 text-center text-xs font-bold tracking-wide'>
            {node.config.placeholder || '请在下方签名区签名'}
          </p>
          <div className='absolute right-3 bottom-3 flex gap-2'>
            <Eraser className='text-muted-foreground/30 h-3.5 w-3.5' />
            {node.config.allowImage && (
              <ImageIcon className='text-muted-foreground/30 h-3.5 w-3.5' />
            )}
          </div>
        </div>
      </div>
    )
  },
  configPanel: function ConfigPanel({ node }: { node: QuestionNode }) {
    const updateNodeConfig = useBuilderStore((s) => s.updateNodeConfig)
    const config = node.config as any

    return (
      <div className='space-y-5 p-3 font-sans'>
        {/* 按钮文本 */}
        <div className='space-y-2'>
          <label className='text-muted-foreground/60 text-[11px] font-bold tracking-widest uppercase'>
            签名引导文本
          </label>
          <Input
            className='bg-muted/20 hover:bg-muted/40 h-8 border-transparent text-xs shadow-none transition-colors'
            value={config.placeholder || ''}
            placeholder='请签名...'
            onChange={(e) =>
              updateNodeConfig(node.id, { placeholder: e.target.value })
            }
          />
        </div>

        {/* 功能开关 */}
        <div className='border-border/40 space-y-4 border-t pt-3'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <p className='text-xs font-medium'>支持导入图片</p>
              <p className='text-muted-foreground/60 text-[10px]'>
                允许用户手动上传签名图
              </p>
            </div>
            <Switch
              checked={!!config.allowImage}
              onCheckedChange={(v) =>
                updateNodeConfig(node.id, { allowImage: v })
              }
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <p className='text-xs font-medium'>必选笔迹颜色</p>
              <p className='text-muted-foreground/60 text-[10px]'>
                固定使用黑色笔迹
              </p>
            </div>
            <Switch
              checked={!!config.isBlackOnly}
              onCheckedChange={(v) =>
                updateNodeConfig(node.id, { isBlackOnly: v })
              }
            />
          </div>
        </div>

        <div className='border-border/40 text-muted-foreground/60 space-y-2 border-t pt-3 text-[10px] leading-tight italic'>
          <p>
            💡 提示：
            <br />
            签名结果将在问卷提交后生成透明 PNG 图像。
          </p>
        </div>
      </div>
    )
  },
  capabilities: {
    valueType: 'none',
    operators: ['is_empty', 'is_not_empty'],
  },
}
