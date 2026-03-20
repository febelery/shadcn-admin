'use client'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBuilderStore } from '@/features/survey-builder/store'
import type {
  NodeValidation,
  QuestionNode,
} from '@/features/survey-builder/types'

const VALIDATION_OPTIONS = [
  { value: 'required', label: '必填', hasValue: false },
  { value: 'min_length', label: '最小字符数', hasValue: true, unit: '字符' },
  { value: 'max_length', label: '最大字符数', hasValue: true, unit: '字符' },
  { value: 'min_value', label: '最小数值', hasValue: true, unit: '' },
  { value: 'max_value', label: '最大数值', hasValue: true, unit: '' },
  { value: 'email', label: '邮箱格式', hasValue: false },
  { value: 'phone', label: '手机号格式', hasValue: false },
  { value: 'url', label: 'URL 格式', hasValue: false },
  { value: 'regex', label: '正则表达式', hasValue: true, unit: '模式' },
]

export function ValidationConfig({ node }: { node: QuestionNode }) {
  const { updateNode } = useBuilderStore()
  const validations = node.validations ?? []

  const add = () => {
    const newV: NodeValidation = {
      id: crypto.randomUUID(),
      type: 'required',
      message: '此项为必填',
    }
    updateNode(node.id, { validations: [...validations, newV] })
  }

  const update = (id: string, patch: Partial<NodeValidation>) =>
    updateNode(node.id, {
      validations: validations.map((v) =>
        v.id === id ? { ...v, ...patch } : v
      ),
    })

  const remove = (id: string) =>
    updateNode(node.id, { validations: validations.filter((v) => v.id !== id) })

  if (validations.length === 0) {
    return (
      <div className='px-3 pb-3'>
        <button
          onClick={add}
          className='border-border text-muted-foreground hover:border-foreground/30 hover:bg-muted/30 hover:text-foreground flex w-full items-center justify-center gap-2 rounded-md border border-dashed py-3 text-xs font-medium transition-all'
        >
          <Plus className='h-3.5 w-3.5' />
          添加校验规则
        </button>
      </div>
    )
  }

  return (
    <div>
      {validations.map((v) => {
        const opt = VALIDATION_OPTIONS.find((o) => o.value === v.type)
        return (
          <div
            key={v.id}
            className='group border-border/30 border-b px-3 py-2.5 last:border-0'
          >
            <div className='mb-2 flex items-center gap-2'>
              {/* Type select */}
              <Select
                value={v.type}
                onValueChange={(t) =>
                  update(v.id, {
                    type: t as NodeValidation['type'],
                    message:
                      VALIDATION_OPTIONS.find((o) => o.value === t)?.label +
                      '校验失败',
                  })
                }
              >
                <SelectTrigger className='h-7 flex-1 text-xs'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VALIDATION_OPTIONS.map((o) => (
                    <SelectItem
                      key={o.value}
                      value={o.value}
                      className='text-xs'
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Value input if needed */}
              {opt?.hasValue && (
                <Input
                  type={
                    opt.value.includes('length') || opt.value.includes('value')
                      ? 'number'
                      : 'text'
                  }
                  className='h-7 w-20 text-xs'
                  value={(v as any).value ?? ''}
                  placeholder={opt.unit}
                  onChange={(e) =>
                    update(v.id, { value: e.target.value } as any)
                  }
                />
              )}

              {/* Delete */}
              <button
                className='text-border/30 hover:text-destructive shrink-0 transition-colors'
                onClick={() => remove(v.id)}
              >
                <X className='h-3.5 w-3.5' />
              </button>
            </div>

            {/* Error message */}
            <Input
              className='text-muted-foreground bg-muted/30 h-7 text-[11px]'
              value={v.message}
              placeholder='校验失败提示语...'
              onChange={(e) => update(v.id, { message: e.target.value })}
            />
          </div>
        )
      })}

      {/* Add rule */}
      <button
        onClick={add}
        className='border-border/30 text-muted-foreground hover:bg-muted/30 hover:text-foreground flex w-full items-center gap-2 border-t px-3 py-2 text-xs font-medium transition-colors'
      >
        <Plus className='h-3.5 w-3.5' />
        添加规则
      </button>
    </div>
  )
}
