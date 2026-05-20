import { type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { SurveyDefaultNumberingStyle } from '../../core/types'
import { SURVEY_NUMBERING_OPTIONS } from '../../shared/question-numbering'

/** 纵向表单项：标签在上、控件通栏 */
export function InspectorFormField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <Label
        htmlFor={htmlFor}
        className='text-muted-foreground text-xs font-normal'
      >
        {label}
      </Label>
      {children}
      {hint ? (
        <p className='text-muted-foreground text-[11px] leading-relaxed'>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** 开关行：说明左、Switch 右 */
export function InspectorSwitchField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className='flex items-start justify-between gap-3'>
      <div className='flex min-w-0 flex-col gap-0.5'>
        <Label
          htmlFor={id}
          className='text-sm leading-snug font-normal'
        >
          {label}
        </Label>
        {description ? (
          <p className='text-muted-foreground text-[11px] leading-relaxed'>
            {description}
          </p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className='mt-0.5 shrink-0'
      />
    </div>
  )
}

/** 轻量分组（无折叠） */
export function InspectorFormGroup({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className='bg-muted/25 flex flex-col gap-3 rounded-lg border p-3'>
      <div className='flex flex-col gap-0.5'>
        <p className='text-xs font-medium'>{title}</p>
        {description ? (
          <p className='text-muted-foreground text-[11px] leading-relaxed'>
            {description}
          </p>
        ) : null}
      </div>
      <div className='flex flex-col gap-3'>{children}</div>
    </div>
  )
}

/** 可折叠卡片分组 */
export function InspectorSection({
  title,
  description,
  defaultOpen = true,
  children,
}: {
  title: string
  description?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className='group/panel'>
      <Card className='gap-0 overflow-hidden py-0 shadow-sm'>
        <CardHeader className='block p-0'>
          <CollapsibleTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              className='hover:bg-muted/60 h-auto min-h-11 w-full justify-between rounded-none px-4 py-3 font-medium'
            >
              <div className='flex min-w-0 flex-col items-start gap-0.5 text-start'>
                <CardTitle className='text-sm'>{title}</CardTitle>
                {description ? (
                  <CardDescription className='text-[11px] leading-snug'>
                    {description}
                  </CardDescription>
                ) : null}
              </div>
              <ChevronDown className='text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=open]/panel:rotate-180' />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent className='overflow-hidden'>
          <CardContent className='flex min-w-0 flex-col gap-4 overflow-x-hidden px-4 pt-0 pb-4'>
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

/** 主题色选择器 */
export function InspectorColorField({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <ColorPicker
      value={value}
      onValueChange={onValueChange}
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
          <span className='text-muted-foreground min-w-0 flex-1 truncate text-left font-mono text-xs'>
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

/** 题号样式选择器 */
export function NumberingStyleSelect({
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
              <span className='text-muted-foreground font-mono text-[11px] leading-none'>
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
              <span className='text-muted-foreground font-mono text-[11px]'>
                {o.sample}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
