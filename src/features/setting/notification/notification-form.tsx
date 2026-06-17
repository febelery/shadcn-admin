import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'

const notificationFormSchema = z.object({
  type: z.enum(['all', 'mentions', 'none'], {
    message: 'Please select a notification type.',
  }),
  mobile: z.boolean().default(false).optional(),
  communication_emails: z.boolean().default(false).optional(),
  social_emails: z.boolean().default(false).optional(),
  marketing_emails: z.boolean().default(false).optional(),
  security_emails: z.boolean(),
})

type NotificationFormValues = z.infer<typeof notificationFormSchema>

export function NotificationForm() {
  const form = useForm({
    defaultValues: {
      type: 'all' as const,
      mobile: false,
      communication_emails: false,
      marketing_emails: false,
      social_emails: true,
      security_emails: true,
    } as NotificationFormValues,
    validators: {
      onChange: notificationFormSchema,
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
      {/* 通知频次 */}
      <form.Field
        name='type'
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <FieldSet>
              <FieldLegend variant='label'>Notify me about...</FieldLegend>
              <RadioGroup
                name={field.name}
                value={field.state.value}
                onValueChange={(val) => field.handleChange(val as any)}
                className='flex flex-col gap-2'
              >
                <Field orientation='horizontal' data-invalid={isInvalid}>
                  <RadioGroupItem value='all' id={`${field.name}-all`} />
                  <FieldLabel htmlFor={`${field.name}-all`} className='font-normal cursor-pointer'>
                    All new messages
                  </FieldLabel>
                </Field>
                <Field orientation='horizontal' data-invalid={isInvalid}>
                  <RadioGroupItem value='mentions' id={`${field.name}-mentions`} />
                  <FieldLabel htmlFor={`${field.name}-mentions`} className='font-normal cursor-pointer'>
                    Direct messages and mentions
                  </FieldLabel>
                </Field>
                <Field orientation='horizontal' data-invalid={isInvalid}>
                  <RadioGroupItem value='none' id={`${field.name}-none`} />
                  <FieldLabel htmlFor={`${field.name}-none`} className='font-normal cursor-pointer'>
                    Nothing
                  </FieldLabel>
                </Field>
              </RadioGroup>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </FieldSet>
          )
        }}
      />

      {/* 邮件通知开关组 */}
      <div className='relative'>
        <h3 className='mb-4 text-lg font-medium'>Email Notifications</h3>
        <div className='space-y-4'>
          {/* 通讯邮件 */}
          <form.Field
            name='communication_emails'
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field
                  orientation='horizontal'
                  data-invalid={isInvalid}
                  className='justify-between rounded-lg border p-4'
                >
                  <FieldContent>
                    <FieldLabel htmlFor={field.name} className='text-base font-medium'>
                      Communication emails
                    </FieldLabel>
                    <FieldDescription>
                      Receive emails about your account activity.
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </FieldContent>
                  <Switch
                    id={field.name}
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                    aria-invalid={isInvalid}
                  />
                </Field>
              )
            }}
          />

          {/* 推广邮件 */}
          <form.Field
            name='marketing_emails'
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field
                  orientation='horizontal'
                  data-invalid={isInvalid}
                  className='justify-between rounded-lg border p-4'
                >
                  <FieldContent>
                    <FieldLabel htmlFor={field.name} className='text-base font-medium'>
                      Marketing emails
                    </FieldLabel>
                    <FieldDescription>
                      Receive emails about new products, features, and more.
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </FieldContent>
                  <Switch
                    id={field.name}
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                    aria-invalid={isInvalid}
                  />
                </Field>
              )
            }}
          />

          {/* 社交邮件 */}
          <form.Field
            name='social_emails'
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field
                  orientation='horizontal'
                  data-invalid={isInvalid}
                  className='justify-between rounded-lg border p-4'
                >
                  <FieldContent>
                    <FieldLabel htmlFor={field.name} className='text-base font-medium'>
                      Social emails
                    </FieldLabel>
                    <FieldDescription>
                      Receive emails for friend requests, follows, and more.
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </FieldContent>
                  <Switch
                    id={field.name}
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                    aria-invalid={isInvalid}
                  />
                </Field>
              )
            }}
          />

          {/* 安全邮件 */}
          <form.Field
            name='security_emails'
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field
                  orientation='horizontal'
                  data-invalid={isInvalid}
                  className='justify-between rounded-lg border p-4'
                >
                  <FieldContent>
                    <FieldLabel htmlFor={field.name} className='text-base font-medium'>
                      Security emails
                    </FieldLabel>
                    <FieldDescription>
                      Receive emails about your account activity and security.
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </FieldContent>
                  <Switch
                    id={field.name}
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                    aria-invalid={isInvalid}
                    disabled
                  />
                </Field>
              )
            }}
          />
        </div>
      </div>

      {/* 移动端独立设置 */}
      <form.Field
        name='mobile'
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field orientation='horizontal' data-invalid={isInvalid} className='items-start'>
              <Checkbox
                id={field.name}
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked === true)}
                aria-invalid={isInvalid}
                className='mt-1'
              />
              <FieldContent className='gap-1'>
                <FieldLabel htmlFor={field.name} className='font-normal cursor-pointer'>
                  Use different settings for my mobile devices
                </FieldLabel>
                <FieldDescription>
                  You can manage your mobile notifications in the{' '}
                  <Link
                    to='/setting'
                    className='underline decoration-dashed underline-offset-4 hover:decoration-solid'
                  >
                    mobile settings
                  </Link>{' '}
                  page.
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </FieldContent>
            </Field>
          )
        }}
      />
      <Button type='submit'>Update notifications</Button>
    </form>
  )
}
