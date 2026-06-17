import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const profileFormSchema = z.object({
  username: z
    .string('Please enter your username.')
    .min(2, 'Username must be at least 2 characters.')
    .max(30, 'Username must not be longer than 30 characters.'),
  email: z.email({
    error: (iss) =>
      iss.input === undefined
        ? 'Please select an email to display.'
        : undefined,
  }),
  bio: z.string().max(160).min(4),
  urls: z
    .array(
      z.object({
        value: z.url('Please enter a valid URL.'),
      })
    )
    .optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      bio: 'I own a computer.',
      urls: [
        { value: 'https://shadcn.com' },
        { value: 'http://twitter.com/shadcn' },
      ],
    } as ProfileFormValues,
    validators: {
      onChange: profileFormSchema,
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
      {/* 用户名输入框 */}
      <form.Field
        name='username'
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Username</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value || ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder='shadcn'
              />
              <FieldDescription>
                This is your public display name. It can be your real name or a
                pseudonym. You can only change this once every 30 days.
              </FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      {/* 邮箱下拉框 */}
      <form.Field
        name='email'
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Select
                name={field.name}
                value={field.state.value || ''}
                onValueChange={field.handleChange}
              >
                <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                  <SelectValue placeholder='Select a verified email to display' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='m@example.com'>m@example.com</SelectItem>
                  <SelectItem value='m@google.com'>m@google.com</SelectItem>
                  <SelectItem value='m@support.com'>m@support.com</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>
                You can manage verified email addresses in your{' '}
                <Link to='/'>email settings</Link>.
              </FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      {/* 个人简介文本域 */}
      <form.Field
        name='bio'
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Bio</FieldLabel>
              <Textarea
                id={field.name}
                name={field.name}
                placeholder='Tell us a little bit about yourself'
                className='resize-none'
                value={field.state.value || ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
              />
              <FieldDescription>
                You can <span>@mention</span> other users and organizations to
                link to them.
              </FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      {/* URLs 数组动态表单项 */}
      <form.Field
        name='urls'
        mode='array'
        children={(field) => (
          <div className='space-y-4'>
            {field.state.value?.map((_, index) => (
              <form.Field
                key={index}
                name={`urls[${index}].value`}
                children={(subField) => {
                  const isSubFieldInvalid =
                    subField.state.meta.isTouched && !subField.state.meta.isValid
                  return (
                    <Field data-invalid={isSubFieldInvalid}>
                      <FieldLabel className={cn(index !== 0 && 'sr-only')} htmlFor={subField.name}>
                        URLs
                      </FieldLabel>
                      {index === 0 && (
                        <FieldDescription>
                          Add links to your website, blog, or social media profiles.
                        </FieldDescription>
                      )}
                      <Input
                        id={subField.name}
                        name={subField.name}
                        value={subField.state.value || ''}
                        onBlur={subField.handleBlur}
                        onChange={(e) => subField.handleChange(e.target.value)}
                        aria-invalid={isSubFieldInvalid}
                        className={cn(index !== 0 && 'mt-1.5')}
                      />
                      {isSubFieldInvalid && <FieldError errors={subField.state.meta.errors} />}
                    </Field>
                  )
                }}
              />
            ))}
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='mt-2'
              onClick={() => field.pushValue({ value: '' })}
            >
              Add URL
            </Button>
          </div>
        )}
      />

      <Button type='submit'>Update profile</Button>
    </form>
  )
}
