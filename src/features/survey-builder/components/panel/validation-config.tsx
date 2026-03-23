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
import {
  type NodeValidation,
  type QuestionNode,
  getValidationsForType,
} from '@/features/survey-builder/types'

// 校验规则元数据
// 展示内容由 getValidationsForType() 过滤，required 统一由 node.required 控制
const ALL_VALIDATION_META: Record<
  NodeValidation['type'],
  { label: string; hasValue: boolean; inputType?: string; placeholder?: string }
> = {
  required: { label: '必填', hasValue: false }, // 保留定义，但不暴露给用户
  min_length: {
    label: '最少字符数',
    hasValue: true,
    inputType: 'number',
    placeholder: '字符数',
  },
  max_length: {
    label: '最多字符数',
    hasValue: true,
    inputType: 'number',
    placeholder: '字符数',
  },
  min_value: {
    label: '最小数值',
    hasValue: true,
    inputType: 'number',
    placeholder: '数值',
  },
  max_value: {
    label: '最大数值',
    hasValue: true,
    inputType: 'number',
    placeholder: '数值',
  },
  date_range: { label: '日期范围', hasValue: false },
  file_type: {
    label: '文件类型',
    hasValue: true,
    inputType: 'text',
    placeholder: '.jpg,.png',
  },
  file_size: {
    label: '最大文件大小',
    hasValue: true,
    inputType: 'number',
    placeholder: 'MB',
  },
  email: { label: '邮箱格式', hasValue: false },
  phone: { label: '手机号格式', hasValue: false },
  url: { label: 'URL 格式', hasValue: false },
  regex: {
    label: '正则表达式',
    hasValue: true,
    inputType: 'text',
    placeholder: '正则模式',
  },
}

export function ValidationConfig({ node }: { node: QuestionNode }) {
  const updateNode = useBuilderStore((s) => s.updateNode)
  const validations = node.validations ?? []

  // 当前题型允许的校验类型（已排除 required）
  const allowedTypes = getValidationsForType(node.type)

  const add = () => {
    if (allowedTypes.length === 0) return
    const firstType = allowedTypes[0]
    const meta = ALL_VALIDATION_META[firstType]
    const newV: NodeValidation = {
      id: crypto.randomUUID(),
      type: firstType,
      message: `${meta.label}校验失败`,
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

  // 该题型不支持任何额外校验（如单选、评分等）
  if (allowedTypes.length === 0) {
    return (
      <div className='px-3 py-3 text-center'>
        <p className='text-muted-foreground/50 text-[11px]'>
          此题型不支持自定义校验规则
        </p>
        <p className='text-muted-foreground/40 mt-1 text-[10px]'>
          必填控制请使用上方「必填项」开关
        </p>
      </div>
    )
  }

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
        const meta = ALL_VALIDATION_META[v.type]
        return (
          <div
            key={v.id}
            className='group border-border/30 border-b px-3 py-2.5 last:border-0'
          >
            <div className='mb-2 flex items-center gap-2'>
              <Select
                value={v.type}
                onValueChange={(t) =>
                  update(v.id, {
                    type: t as NodeValidation['type'],
                    message: `${ALL_VALIDATION_META[t as NodeValidation['type']]?.label ?? t}校验失败`,
                    params: undefined,
                  })
                }
              >
                <SelectTrigger className='h-7 flex-1 text-xs'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedTypes.map((type) => (
                    <SelectItem key={type} value={type} className='text-xs'>
                      {ALL_VALIDATION_META[type]?.label ?? type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {meta?.hasValue && (
                <Input
                  type={meta.inputType ?? 'text'}
                  className='h-7 w-20 text-xs'
                  value={(v.params as any)?.value ?? ''}
                  placeholder={meta.placeholder}
                  onChange={(e) =>
                    update(v.id, { params: { value: e.target.value } } as any)
                  }
                />
              )}

              <button
                className='text-border/30 hover:text-destructive shrink-0 transition-colors'
                onClick={() => remove(v.id)}
              >
                <X className='h-3.5 w-3.5' />
              </button>
            </div>

            <Input
              className='text-muted-foreground bg-muted/30 h-7 text-[11px]'
              value={v.message}
              placeholder='校验失败提示语...'
              onChange={(e) => update(v.id, { message: e.target.value })}
            />
          </div>
        )
      })}

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
