import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BUILDER_TEXT_LIMITS } from '../../../shared/text-limits'
import { OptionEditor } from '../option-editor'
import { InspectorFormField, InspectorFormGroup } from './layout'
import type { QuestionInspectorProps } from './types'

export function RatingInspectorFields({
  question,
  onConfigChange,
}: QuestionInspectorProps<'rating'>) {
  return (
    <InspectorFormField label='星级数量'>
      <Input
        type='number'
        className='h-9'
        min={1}
        max={10}
        value={question.config.starCount}
        onChange={(event) =>
          onConfigChange({ starCount: Number(event.target.value) })
        }
      />
    </InspectorFormField>
  )
}

export function SliderInspectorFields({
  question,
  onConfigChange,
}: QuestionInspectorProps<'slider'>) {
  const { config } = question

  return (
    <InspectorFormGroup title='滑块范围'>
      <div className='grid grid-cols-3 gap-2'>
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            最小值
          </Label>
          <Input
            type='number'
            value={config.minValue}
            onChange={(event) =>
              onConfigChange({ minValue: Number(event.target.value) })
            }
          />
        </div>
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            最大值
          </Label>
          <Input
            type='number'
            value={config.maxValue}
            onChange={(event) =>
              onConfigChange({ maxValue: Number(event.target.value) })
            }
          />
        </div>
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            步长
          </Label>
          <Input
            type='number'
            min={0}
            value={config.step}
            onChange={(event) =>
              onConfigChange({ step: Number(event.target.value) })
            }
          />
        </div>
      </div>
    </InspectorFormGroup>
  )
}

export function NpsInspectorFields({
  question,
  onConfigChange,
}: QuestionInspectorProps<'nps'>) {
  const { config } = question

  return (
    <InspectorFormGroup title='NPS 量表'>
      <p className='text-muted-foreground text-xs leading-relaxed'>
        标准 NPS 为 0–10 分；可自定义两端说明文案。
      </p>
      <div className='grid grid-cols-2 gap-2'>
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            左侧说明（低分）
          </Label>
          <Input
            value={config.npsLeftLabel ?? '完全不可能'}
            onChange={(event) =>
              onConfigChange({ npsLeftLabel: event.target.value })
            }
          />
        </div>
        <div className='flex flex-col gap-1'>
          <Label className='text-muted-foreground text-xs font-medium'>
            右侧说明（高分）
          </Label>
          <Input
            value={config.npsRightLabel ?? '非常可能'}
            onChange={(event) =>
              onConfigChange({ npsRightLabel: event.target.value })
            }
          />
        </div>
      </div>
    </InspectorFormGroup>
  )
}

export function LikertInspectorFields({
  question,
  onConfigChange,
}: QuestionInspectorProps<'likert'>) {
  const { config } = question

  return (
    <>
      <OptionEditor
        label='陈述项'
        labelMaxLength={BUILDER_TEXT_LIMITS.likertStatement}
        options={config.statements}
        onChange={(statements) => onConfigChange({ statements })}
      />
      <InspectorFormField label='最小分值'>
        <Input
          type='number'
          className='h-9'
          value={config.scaleMin}
          onChange={(event) =>
            onConfigChange({ scaleMin: Number(event.target.value) })
          }
        />
      </InspectorFormField>
      <InspectorFormField label='最大分值'>
        <Input
          type='number'
          className='h-9'
          value={config.scaleMax}
          onChange={(event) =>
            onConfigChange({ scaleMax: Number(event.target.value) })
          }
        />
      </InspectorFormField>
    </>
  )
}
