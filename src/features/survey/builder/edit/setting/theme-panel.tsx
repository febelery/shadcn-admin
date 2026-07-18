import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  ColorPicker,
  ColorPickerAlphaSlider,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerFormatSelect,
  ColorPickerHueSlider,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from '@/components/ui/color-picker'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  isSurveyNumberingEnabled,
  SURVEY_NUMBERING_MODE_OPTIONS,
  SURVEY_NUMBERING_OPTIONS,
} from '@/features/survey/shared/question-numbering'
import { useBuilderStore } from '../../store'
import type {
  QuestionNumberingMode,
  SurveyDefaultNumberingStyle,
} from '../../types'
import { InspectorSection } from '../inspector/panel'

function NumberingStyleSelect({
  value,
  onValueChange,
}: {
  value: SurveyDefaultNumberingStyle
  onValueChange: (value: SurveyDefaultNumberingStyle) => void
}) {
  const selected = SURVEY_NUMBERING_OPTIONS.find((o) => o.value === value)

  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as SurveyDefaultNumberingStyle)}
    >
      <SelectTrigger className='h-auto min-h-9 w-full py-1.5'>
        <SelectValue placeholder='选择题号样式'>
          {selected ? (
            <span className='flex flex-col items-start gap-0.5 text-left'>
              <span className='text-sm leading-none'>{selected.label}</span>
              <span className='text-muted-foreground font-mono text-xs leading-none tabular-nums'>
                {selected.sample}
              </span>
            </span>
          ) : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SURVEY_NUMBERING_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value} className='py-2'>
            <span className='flex flex-col gap-0.5'>
              <span>{o.label}</span>
              <span className='text-muted-foreground font-mono text-xs leading-none tabular-nums'>
                {o.sample}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function LocalColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <ColorPicker
      value={value}
      onValueChange={onChange}
      defaultFormat='hex'
      className='w-full'
    >
      <ColorPickerTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className='h-9 w-full justify-start gap-2 px-2 font-normal'
        >
          <ColorPickerSwatch className='size-5 shrink-0 rounded-sm' />
          <span
            className={cn(
              'text-muted-foreground font-mono text-xs leading-none tabular-nums',
              'min-w-0 flex-1 truncate text-left'
            )}
          >
            {value}
          </span>
        </Button>
      </ColorPickerTrigger>
      <ColorPickerContent align='start' className='w-auto'>
        <ColorPickerArea />
        <div className='flex flex-col gap-2'>
          <ColorPickerHueSlider />
          <ColorPickerAlphaSlider />
        </div>
        <div className='flex items-center gap-2'>
          <ColorPickerEyeDropper />
          <ColorPickerFormatSelect className='w-20 shrink-0' />
          <ColorPickerInput withoutAlpha className='min-w-0 flex-1' />
        </div>
      </ColorPickerContent>
    </ColorPicker>
  )
}

export function ThemePanel() {
  const document = useBuilderStore((s) => s.document)
  const updateMeta = useBuilderStore((s) => s.updateMeta)
  const updateTheme = useBuilderStore((s) => s.updateTheme)

  const meta = document.meta
  const primaryColor = document.theme.primaryColor

  const numberingStyle = meta.defaultQuestionNumbering ?? 'decimal'
  const numberingMode = meta.questionNumberingMode ?? 'global'

  return (
    <InspectorSection title='主题' description='品牌色与题号样式' defaultOpen>
      <Field className='gap-1.5'>
        <FieldLabel className='text-muted-foreground text-xs font-medium'>
          题号样式（全卷）
        </FieldLabel>
        <NumberingStyleSelect
          value={numberingStyle}
          onValueChange={(v) => updateMeta({ defaultQuestionNumbering: v })}
        />
        <FieldDescription className='text-muted-foreground text-xs leading-relaxed'>
          全卷统一题号格式；选「不显示」则关闭所有题号。各题可单独隐藏题号，编号方式见下方。
        </FieldDescription>
      </Field>

      {isSurveyNumberingEnabled(numberingStyle) ? (
        <Field className='gap-1.5'>
          <FieldLabel className='text-muted-foreground text-xs font-medium'>
            题号编号方式
          </FieldLabel>
          <Select
            value={numberingMode}
            onValueChange={(v) =>
              updateMeta({
                questionNumberingMode: v as QuestionNumberingMode,
              })
            }
          >
            <SelectTrigger className='h-9 w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SURVEY_NUMBERING_MODE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription className='text-muted-foreground text-xs leading-relaxed'>
            {
              SURVEY_NUMBERING_MODE_OPTIONS.find(
                (o) => o.value === numberingMode
              )?.hint
            }
          </FieldDescription>
        </Field>
      ) : null}

      <Field className='gap-1.5'>
        <FieldLabel className='text-muted-foreground text-xs font-medium'>
          主题色
        </FieldLabel>
        <LocalColorPicker
          value={primaryColor}
          onChange={(color) => updateTheme({ primaryColor: color })}
        />
      </Field>
    </InspectorSection>
  )
}
