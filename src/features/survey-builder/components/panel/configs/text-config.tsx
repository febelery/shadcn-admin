'use client'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBuilderStore } from '@/features/survey-builder/store'
import type { QuestionNode } from '@/features/survey-builder/types'

// ── Text / Textarea / Number / Fill-in config ─────────────
export function TextConfig({ node }: { node: QuestionNode }) {
  // 架构修正：提取原子的动作分配器，不要订阅整个 store 导致每次 store 更新都让 Panel 重绘
  const updateNodeConfig = useBuilderStore((s) => s.updateNodeConfig)

  const config = node.config as {
    placeholder?: string
    maxLength?: number
    minLength?: number
    minValue?: number
    maxValue?: number
    step?: number
    format?: string
    prefix?: string
    suffix?: string
    textAreaRows?: number
  }

  const isNumber = node.type === 'number'
  const isTextArea = node.type === 'textarea'

  return (
    <FieldGroup className='px-3 pb-2'>
      {/* Placeholder */}
      <Field>
        <FieldLabel className='text-muted-foreground text-[11px] font-medium'>
          占位提示文字
        </FieldLabel>
        <Input
          className='h-7 text-xs'
          value={config.placeholder ?? ''}
          placeholder='请输入...'
          onChange={(e) =>
            updateNodeConfig(node.id, { placeholder: e.target.value })
          }
        />
      </Field>

      {/* Text length limits */}
      {!isNumber && (
        <div className='flex items-start gap-2'>
          <Field className='flex-1'>
            <FieldLabel className='text-muted-foreground text-[10px]'>
              最少字符
            </FieldLabel>
            <Input
              type='number'
              min={0}
              className='h-7 text-xs'
              value={config.minLength ?? ''}
              placeholder='不限'
              onChange={(e) =>
                updateNodeConfig(node.id, {
                  minLength: e.target.value ? +e.target.value : undefined,
                })
              }
            />
          </Field>
          <Field className='flex-1'>
            <FieldLabel className='text-muted-foreground text-[10px]'>
              最多字符
            </FieldLabel>
            <Input
              type='number'
              min={1}
              className='h-7 text-xs'
              value={config.maxLength ?? ''}
              placeholder='不限'
              onChange={(e) =>
                updateNodeConfig(node.id, {
                  maxLength: e.target.value ? +e.target.value : undefined,
                })
              }
            />
          </Field>
        </div>
      )}

      {/* Number range */}
      {isNumber && (
        <>
          <div className='flex items-start gap-2'>
            <Field className='flex-1'>
              <FieldLabel className='text-muted-foreground text-[10px]'>
                最小值
              </FieldLabel>
              <Input
                type='number'
                className='h-7 text-xs'
                value={config.minValue ?? ''}
                placeholder='不限'
                onChange={(e) =>
                  updateNodeConfig(node.id, {
                    minValue: e.target.value ? +e.target.value : undefined,
                  })
                }
              />
            </Field>
            <Field className='flex-1'>
              <FieldLabel className='text-muted-foreground text-[10px]'>
                最大值
              </FieldLabel>
              <Input
                type='number'
                className='h-7 text-xs'
                value={config.maxValue ?? ''}
                placeholder='不限'
                onChange={(e) =>
                  updateNodeConfig(node.id, {
                    maxValue: e.target.value ? +e.target.value : undefined,
                  })
                }
              />
            </Field>
          </div>

          <Field>
            <FieldLabel className='text-muted-foreground text-[11px] font-medium'>
              步进值
            </FieldLabel>
            <Input
              type='number'
              min={0.01}
              step={0.01}
              className='h-7 text-xs'
              value={config.step ?? ''}
              placeholder='1'
              onChange={(e) =>
                updateNodeConfig(node.id, {
                  step: e.target.value ? +e.target.value : undefined,
                })
              }
            />
          </Field>

          {/* Prefix / Suffix */}
          <div className='flex items-start gap-2'>
            <Field className='flex-1'>
              <FieldLabel className='text-muted-foreground text-[10px]'>
                前缀
              </FieldLabel>
              <Input
                className='h-7 text-xs'
                value={config.prefix ?? ''}
                placeholder='¥'
                onChange={(e) =>
                  updateNodeConfig(node.id, { prefix: e.target.value })
                }
              />
            </Field>
            <Field className='flex-1'>
              <FieldLabel className='text-muted-foreground text-[10px]'>
                后缀
              </FieldLabel>
              <Input
                className='h-7 text-xs'
                value={config.suffix ?? ''}
                placeholder='元'
                onChange={(e) =>
                  updateNodeConfig(node.id, { suffix: e.target.value })
                }
              />
            </Field>
          </div>
        </>
      )}

      {/* Textarea rows */}
      {isTextArea && (
        <Field>
          <FieldLabel className='text-muted-foreground text-[11px] font-medium'>
            默认行数
          </FieldLabel>
          <Input
            type='number'
            min={2}
            max={20}
            className='h-7 text-xs'
            value={config.textAreaRows ?? 4}
            onChange={(e) =>
              updateNodeConfig(node.id, { textAreaRows: +e.target.value })
            }
          />
        </Field>
      )}

      {/* Format for text (email, phone, url, etc.) */}
      {node.type === 'text' && (
        <Field className='pt-1'>
          <FieldLabel className='text-muted-foreground text-[11px] font-medium'>
            输入格式校验
          </FieldLabel>
          <Select
            value={config.format ?? 'none'}
            onValueChange={(v) =>
              updateNodeConfig(node.id, {
                format: v === 'none' ? undefined : v,
              })
            }
          >
            <SelectTrigger className='h-8 text-xs'>
              <SelectValue placeholder='不限格式' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='none'>不限格式</SelectItem>
              <SelectItem value='email'>邮箱地址</SelectItem>
              <SelectItem value='phone'>手机号码</SelectItem>
              <SelectItem value='url'>网址 URL</SelectItem>
              <SelectItem value='id_card'>身份证号</SelectItem>
              <SelectItem value='number_only'>纯数字</SelectItem>
              <SelectItem value='letter_only'>纯字母</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}
    </FieldGroup>
  )
}
