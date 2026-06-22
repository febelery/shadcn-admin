import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { Check, ChevronsUpDown } from 'lucide-react'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { DatePicker } from '@/components/date-picker'

const languages = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Spanish', value: 'es' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Chinese', value: 'zh' },
] as const

const accountFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Please enter your name.')
    .min(2, 'Name must be at least 2 characters.')
    .max(30, 'Name must not be longer than 30 characters.'),
  dob: z.date({
    message: 'Please select your date of birth.',
  }),
  language: z.string().min(1, 'Please select a language.'),
})

type AccountFormValues = z.infer<typeof accountFormSchema>

export function AccountForm() {
  const form = useForm({
    defaultValues: {
      name: '',
      dob: undefined as unknown as Date,
      language: '',
    } as AccountFormValues,
    validators: {
      onChange: accountFormSchema,
    },
    onSubmit: async ({ value }) => {
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
      {/* 姓名 */}
      <form.Field
        name='name'
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value || ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder='Your name'
                aria-invalid={isInvalid}
              />
              <FieldDescription>
                This is the name that will be displayed on your profile and in
                emails.
              </FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      {/* 生日 */}
      <form.Field
        name='dob'
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid} className='flex flex-col'>
              <FieldLabel htmlFor={field.name}>Date of birth</FieldLabel>
              <DatePicker
                value={field.state.value}
                onChange={(date) => field.handleChange(date as Date)}
              />
              <FieldDescription>
                Your date of birth is used to calculate your age.
              </FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      {/* 语言偏好 */}
      <form.Field
        name='language'
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid} className='flex flex-col'>
              <FieldLabel htmlFor={field.name}>Language</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    role='combobox'
                    className={cn(
                      'w-[200px] justify-between',
                      !field.state.value && 'text-muted-foreground'
                    )}
                  >
                    {field.state.value
                      ? languages.find(
                          (language) => language.value === field.state.value
                        )?.label
                      : 'Select language'}
                    <ChevronsUpDown className='ms-2 h-4 w-4 shrink-0 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-[200px] p-0'>
                  <Command>
                    <CommandInput placeholder='Search language...' />
                    <CommandEmpty>No language found.</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {languages.map((language) => (
                          <CommandItem
                            value={language.label}
                            key={language.value}
                            onSelect={() => {
                              field.handleChange(language.value)
                            }}
                          >
                            <Check
                              className={cn(
                                'size-4',
                                language.value === field.state.value
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            {language.label}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FieldDescription>
                This is the language that will be used in the dashboard.
              </FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      <Button type='submit'>Update account</Button>
    </form>
  )
}
