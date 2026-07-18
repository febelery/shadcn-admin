import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { QuestionType } from '../../../../core/types'
import { InspectorFormGroup } from './layout'
import type { QuestionInspectorProps } from './types'

type TextQuestionType = Extract<
  QuestionType,
  'text' | 'textarea' | 'email' | 'phone' | 'url'
>

export function TextInputInspectorFields({
  question,
  onConfigChange,
}: QuestionInspectorProps<TextQuestionType>) {
  const { type, config } = question

  return (
    <InspectorFormGroup title='输入设置'>
      <div className='flex flex-col gap-1'>
        <Label className='text-muted-foreground text-xs font-medium'>
          占位提示
        </Label>
        <Input
          value={config.placeholder ?? ''}
          onChange={(event) =>
            onConfigChange({ placeholder: event.target.value })
          }
        />
      </div>
      {type === 'textarea' ? (
        <div className='grid grid-cols-2 gap-2'>
          <div className='flex flex-col gap-1'>
            <Label className='text-muted-foreground text-xs font-medium'>
              显示行数
            </Label>
            <Input
              type='number'
              min={2}
              max={20}
              value={config.textareaRows ?? 4}
              onChange={(event) =>
                onConfigChange({ textareaRows: Number(event.target.value) })
              }
            />
          </div>
          <div className='flex flex-col gap-1'>
            <Label className='text-muted-foreground text-xs font-medium'>
              最大字数
            </Label>
            <Input
              type='number'
              min={1}
              value={config.maxLength ?? ''}
              placeholder='不限'
              onChange={(event) =>
                onConfigChange({
                  maxLength: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                })
              }
            />
          </div>
        </div>
      ) : null}
      {type === 'text' ? (
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            最大字数
          </Label>
          <Input
            type='number'
            min={1}
            value={config.maxLength ?? ''}
            placeholder='不限'
            onChange={(event) =>
              onConfigChange({
                maxLength: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
          />
        </div>
      ) : null}
    </InspectorFormGroup>
  )
}

export function NumberInspectorFields({
  question,
  onConfigChange,
}: QuestionInspectorProps<'number'>) {
  const { config } = question

  return (
    <InspectorFormGroup title='数字范围'>
      <div className='flex flex-col gap-1'>
        <Label className='text-muted-foreground text-xs font-medium'>
          占位提示
        </Label>
        <Input
          value={config.placeholder ?? ''}
          onChange={(event) =>
            onConfigChange({ placeholder: event.target.value })
          }
        />
      </div>
      <div className='grid grid-cols-3 gap-2'>
        {(
          [
            ['最小值', 'minValue'],
            ['最大值', 'maxValue'],
            ['步长', 'step'],
          ] as const
        ).map(([label, key]) => (
          <div key={key} className='flex flex-col gap-1'>
            <Label className='text-muted-foreground text-xs font-medium'>
              {label}
            </Label>
            <Input
              type='number'
              min={key === 'step' ? 0 : undefined}
              value={config[key] ?? ''}
              placeholder={key === 'step' ? '1' : '不限'}
              onChange={(event) =>
                onConfigChange({
                  [key]: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                })
              }
            />
          </div>
        ))}
      </div>
    </InspectorFormGroup>
  )
}

export function DateInspectorFields({
  question,
  onConfigChange,
}: QuestionInspectorProps<'date' | 'date_range'>) {
  const { config } = question

  return (
    <InspectorFormGroup title='日期设置'>
      <div className='grid grid-cols-2 gap-2'>
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            最早日期
          </Label>
          <Input
            type='date'
            value={config.minDate ?? ''}
            onChange={(event) =>
              onConfigChange({ minDate: event.target.value || undefined })
            }
          />
        </div>
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            最晚日期
          </Label>
          <Input
            type='date'
            value={config.maxDate ?? ''}
            onChange={(event) =>
              onConfigChange({ maxDate: event.target.value || undefined })
            }
          />
        </div>
      </div>
      <div className='flex flex-col gap-1'>
        <Label className='text-muted-foreground text-xs font-medium'>
          占位提示
        </Label>
        <Input
          value={config.placeholder ?? ''}
          onChange={(event) =>
            onConfigChange({ placeholder: event.target.value })
          }
        />
      </div>
    </InspectorFormGroup>
  )
}
