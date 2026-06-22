import { z } from 'zod'
import { fonts } from '@/config/fonts'
import { useForm } from '@tanstack/react-form'
import { ChevronDown } from 'lucide-react'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { cn } from '@/lib/utils'
import { useFont } from '@/context/font-provider'
import { useTheme } from '@/context/theme-provider'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const appearanceFormSchema = z.object({
  theme: z.enum(['light', 'dark']),
  font: z.enum(fonts),
})

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>

export function AppearanceForm() {
  const { font, setFont } = useFont()
  const { theme, setTheme } = useTheme()

  const form = useForm({
    defaultValues: {
      theme: (theme as 'light' | 'dark') || 'light',
      font: font || fonts[0],
    } as AppearanceFormValues,
    validators: {
      onChange: appearanceFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (value.font !== font) setFont(value.font)
      if (value.theme !== theme) setTheme(value.theme)

      showSubmittedData(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className='space-y-8'
    >
      {/* 字体选择 */}
      <form.Field
        name='font'
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Font</FieldLabel>
              <div className='relative w-max'>
                <select
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value as any)}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'w-[200px] appearance-none font-normal capitalize',
                    'dark:bg-background dark:hover:bg-background'
                  )}
                  aria-invalid={isInvalid}
                >
                  {fonts.map((fontName) => (
                    <option key={fontName} value={fontName}>
                      {fontName}
                    </option>
                  ))}
                </select>
                <ChevronDown className='pointer-events-none absolute inset-e-3 top-2.5 h-4 w-4 opacity-50' />
              </div>
              <FieldDescription className='font-manrope'>
                Set the font you want to use in the dashboard.
              </FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      {/* 主题选择 */}
      <form.Field
        name='theme'
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel>Theme</FieldLabel>
              <FieldDescription>
                Select the theme for the dashboard.
              </FieldDescription>
              <RadioGroup
                name={field.name}
                value={field.state.value}
                onValueChange={(val) => field.handleChange(val as any)}
                className='grid max-w-md grid-cols-2 gap-8 pt-2'
              >
                {/* 浅色主题 */}
                <FieldLabel className='[&:has([data-state=checked])>div]:border-primary flex cursor-pointer flex-col font-normal!'>
                  <RadioGroupItem
                    value='light'
                    className='sr-only'
                    aria-invalid={isInvalid}
                  />
                  <div className='border-muted hover:border-accent w-full items-center rounded-md border-2 p-1'>
                    <div className='space-y-2 rounded-sm bg-[#ecedef] p-2'>
                      <div className='space-y-2 rounded-md bg-white p-2 shadow-xs'>
                        <div className='h-2 w-[80px] rounded-lg bg-[#ecedef]' />
                        <div className='h-2 w-[100px] rounded-lg bg-[#ecedef]' />
                      </div>
                      <div className='flex items-center space-x-2 rounded-md bg-white p-2 shadow-xs'>
                        <div className='h-4 w-4 rounded-full bg-[#ecedef]' />
                        <div className='h-2 w-[100px] rounded-lg bg-[#ecedef]' />
                      </div>
                      <div className='flex items-center space-x-2 rounded-md bg-white p-2 shadow-xs'>
                        <div className='h-4 w-4 rounded-full bg-[#ecedef]' />
                        <div className='h-2 w-[100px] rounded-lg bg-[#ecedef]' />
                      </div>
                    </div>
                  </div>
                  <span className='block w-full p-2 text-center'>Light</span>
                </FieldLabel>

                {/* 深色主题 */}
                <FieldLabel className='[&:has([data-state=checked])>div]:border-primary flex cursor-pointer flex-col font-normal!'>
                  <RadioGroupItem
                    value='dark'
                    className='sr-only'
                    aria-invalid={isInvalid}
                  />
                  <div className='border-muted bg-popover hover:bg-accent hover:text-accent-foreground w-full items-center rounded-md border-2 p-1'>
                    <div className='space-y-2 rounded-sm bg-slate-950 p-2'>
                      <div className='space-y-2 rounded-md bg-slate-800 p-2 shadow-xs'>
                        <div className='h-2 w-[80px] rounded-lg bg-slate-400' />
                        <div className='h-2 w-[100px] rounded-lg bg-slate-400' />
                      </div>
                      <div className='flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-xs'>
                        <div className='h-4 w-4 rounded-full bg-slate-400' />
                        <div className='h-2 w-[100px] rounded-lg bg-slate-400' />
                      </div>
                      <div className='flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-xs'>
                        <div className='h-4 w-4 rounded-full bg-slate-400' />
                        <div className='h-2 w-[100px] rounded-lg bg-slate-400' />
                      </div>
                    </div>
                  </div>
                  <span className='block w-full p-2 text-center'>Dark</span>
                </FieldLabel>
              </RadioGroup>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      <Button type='submit'>Update preferences</Button>
    </form>
  )
}
