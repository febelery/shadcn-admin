import { Paperclip, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { QuestionNode } from '../types'
import { defineQuestion, type QuestionComponentProps } from './index'

/**
 * 3. 导出定义
 */
export const fileUploadType = defineQuestion({
  type: 'file_upload',
  meta: {
    label: '文件上传',
    description: '支持多种格式附件采集',
    icon: Paperclip,
    category: '媒体',
  },
  validationTypes: ['file_type', 'file_size'],
  create: () => ({
    type: 'file_upload',
    title: '请上传相关证明文件',
    required: false,
    config: {
      placeholder: '点击上传文件或拖拽到此处',
      acceptTypes: ['image/*'],
      maxCount: 3,
      maxSize: 10,
    },
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    const acceptTypes = node.config.acceptTypes || []

    return (
      <div className='p-4 opacity-70'>
        <div className='border-muted-foreground/30 bg-muted/5 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6'>
          <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full'>
            <Upload className='text-primary h-5 w-5' />
          </div>
          <div className='flex flex-col gap-1 text-center font-sans'>
            <p className='text-foreground/80 text-xs font-bold'>
              {node.config.placeholder || '点击上传文件或拖拽到此处'}
            </p>
            <p className='text-muted-foreground/60 text-[10px] leading-tight italic'>
              接受类型：
              {acceptTypes.length > 0 ? acceptTypes.join(', ') : '所有文件'}
              <br />
              单个文件不超过 {node.config.maxSize || 10}MB
            </p>
          </div>
        </div>
      </div>
    )
  },
  configPanel: function ConfigPanel({
    node,
    onConfigChange,
  }: QuestionComponentProps) {
    const config = node.config as any

    const mimeOptions = [
      { label: '所有图片', value: 'image/*' },
      { label: '所有视频', value: 'video/*' },
      { label: 'PDF文档', value: 'application/pdf' },
      { label: 'Word文档', value: 'application/msword' },
      { label: 'Excel表格', value: 'application/vnd.ms-excel' },
      { label: '压缩包', value: 'application/zip' },
    ]

    const toggleType = (t: string) => {
      const current = config.acceptTypes || []
      const next = current.includes(t)
        ? current.filter((i: string) => i !== t)
        : [...current, t]
      onConfigChange({ acceptTypes: next })
    }

    return (
      <div className='flex flex-col gap-5 p-3 font-sans'>
        {/* 占位文本 */}
        <div className='flex flex-col gap-2'>
          <label className='text-muted-foreground/60 text-[11px] font-bold tracking-widest uppercase'>
            上传区域文本
          </label>
          <Input
            className='bg-muted/20 hover:bg-muted/40 h-8 border-transparent text-xs shadow-none transition-colors'
            value={config.placeholder || ''}
            placeholder='点击上传或拖拽...'
            onChange={(e) => onConfigChange({ placeholder: e.target.value })}
          />
        </div>

        {/* 格式限制 */}
        <div className='border-border/40 flex flex-col gap-3 border-t pt-3'>
          <label className='text-muted-foreground/60 text-[11px] font-bold tracking-widest uppercase'>
            允许的 MIME 类型
          </label>
          <div className='flex flex-wrap gap-1.5'>
            {mimeOptions.map((opt) => (
              <Badge
                key={opt.value}
                variant={
                  config.acceptTypes?.includes(opt.value)
                    ? 'default'
                    : 'outline'
                }
                className='h-5 cursor-pointer px-1.5 text-[9px] shadow-none transition-all'
                onClick={() => toggleType(opt.value)}
              >
                {opt.label}
              </Badge>
            ))}
          </div>
          <p className='text-muted-foreground/50 px-0.5 text-[9px] italic'>
            注：使用标准 MIME 类型过滤器（如 image/*, video/*）
          </p>
        </div>

        {/* 限制设置 */}
        <div className='border-border/40 grid grid-cols-2 gap-3 border-t pt-3'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-muted-foreground text-[10px]'>
              文件个数上限
            </label>
            <Input
              type='number'
              className='bg-muted/10 h-7 text-xs shadow-none'
              value={config.maxCount || 5}
              onChange={(e) => onConfigChange({ maxCount: +e.target.value })}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-muted-foreground text-[10px]'>
              单文件上限 (MB)
            </label>
            <Input
              type='number'
              className='bg-muted/10 h-7 text-xs shadow-none'
              value={config.maxSize || 10}
              onChange={(e) => onConfigChange({ maxSize: +e.target.value })}
            />
          </div>
        </div>
      </div>
    )
  },
  capabilities: {
    valueType: 'none',
    operators: ['is_empty', 'is_not_empty'],
  },
})
