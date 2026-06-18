import { useState } from 'react'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'

const formSchema = z.object({
  otp: z.string().min(6, '请输入 6 位验证码。').max(6, '请输入 6 位验证码。'),
})

type OtpFormProps = React.HTMLAttributes<HTMLFormElement>

export function OtpForm({ className, ...props }: OtpFormProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      otp: '',
    },
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true)
      showSubmittedData(value)

      setTimeout(() => {
        setIsLoading(false)
        navigate({ to: '/' })
      }, 1000)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className={cn('grid gap-2', className)}
      {...props}
    >
      <form.Field
        name='otp'
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel className='sr-only'>一次性密码</FieldLabel>
              <InputOTP
                maxLength={6}
                value={field.state.value || ''}
                onBlur={field.handleBlur}
                onChange={(val) => field.handleChange(val)}
                aria-invalid={isInvalid}
                containerClassName='justify-between sm:[&>[data-slot="input-otp-group"]>div]:w-12'
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
      <form.Subscribe
        selector={(state) => state.values.otp}
        children={(otp) => (
          <Button className='mt-2' disabled={(otp || '').length < 6 || isLoading}>
            验证
          </Button>
        )}
      />
    </form>
  )
}
