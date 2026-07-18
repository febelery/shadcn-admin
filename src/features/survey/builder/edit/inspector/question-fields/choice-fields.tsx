import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { QuestionType } from '../../../../core/types'
import { OptionEditor } from '../option-editor'
import { InspectorFormGroup } from './layout'
import type { QuestionInspectorProps } from './types'

type ChoiceQuestionType = Extract<
  QuestionType,
  'single_choice' | 'multiple_choice' | 'dropdown' | 'ranking'
>

export function ChoiceInspectorFields({
  question,
  onConfigChange,
}: QuestionInspectorProps<ChoiceQuestionType>) {
  const { type, config } = question

  return (
    <>
      <OptionEditor
        options={config.options}
        onChange={(options) => onConfigChange({ options })}
      />

      <InspectorFormGroup title='选项行为'>
        {type === 'multiple_choice' ? (
          <div className='grid grid-cols-2 gap-2'>
            <div className='flex flex-col gap-1'>
              <Label className='text-muted-foreground text-xs font-medium'>
                最少选择
              </Label>
              <Input
                type='number'
                min={0}
                value={config.minSelect ?? ''}
                placeholder='不限'
                onChange={(event) =>
                  onConfigChange({
                    minSelect: event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  })
                }
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-muted-foreground text-xs font-medium'>
                最多选择
              </Label>
              <Input
                type='number'
                min={1}
                value={config.maxSelect ?? ''}
                placeholder='不限'
                onChange={(event) =>
                  onConfigChange({
                    maxSelect: event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </div>
        ) : null}

        {type === 'single_choice' || type === 'multiple_choice' ? (
          <div className='flex flex-col gap-1'>
            <Label className='text-muted-foreground text-xs font-medium'>
              选项排列
            </Label>
            <Select
              value={config.optionLayout ?? 'vertical'}
              onValueChange={(value) =>
                onConfigChange({
                  optionLayout:
                    value === 'horizontal' ? 'horizontal' : 'vertical',
                })
              }
            >
              <SelectTrigger className={cn('h-8', 'text-xs leading-none')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='vertical'>纵向</SelectItem>
                <SelectItem value='horizontal'>横向</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className='flex items-center gap-2'>
          <Checkbox
            id='randomize'
            checked={config.randomizeOptions ?? false}
            onCheckedChange={(checked) =>
              onConfigChange({ randomizeOptions: Boolean(checked) })
            }
          />
          <Label
            htmlFor='randomize'
            className='text-muted-foreground text-xs font-medium'
          >
            作答时随机打乱选项顺序
          </Label>
        </div>

        {type === 'dropdown' ? (
          <div className='flex flex-col gap-1'>
            <Label className='text-muted-foreground text-xs font-medium'>
              下拉占位文案
            </Label>
            <Input
              value={config.placeholder ?? '请选择'}
              onChange={(event) =>
                onConfigChange({ placeholder: event.target.value })
              }
            />
          </div>
        ) : null}
      </InspectorFormGroup>
    </>
  )
}
