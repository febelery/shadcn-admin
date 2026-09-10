import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from 'cn'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? '请输入您的邮箱' : undefined),
  }),
})

export function ForgotPasswordForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const navigate = useNavigate()
  const form = useForm({
    defaultValues: {
      email: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: formSchema,
    },
    onSubmit: async ({ value }) => {
      console.log(value)

      await toast.promise(sleep(2000), {
        loading: '正在发送邮件...',
        success: () => {
          form.reset()
          navigate({ to: '/otp' })
          return `邮件已发送至 ${value.email}`
        },
        error: '错误',
      })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className={cn('flex flex-col gap-2', className)}
      {...props}
    >
      <form.Field
        name='email'
        children={(field) => {
          const isInvalid =
            field.state.meta.errors.length > 0 &&
            (field.state.meta.isTouched || form.state.submissionAttempts > 0)
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>邮箱</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value || ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder='name@example.com'
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
      <Button type='submit' className='mt-2' disabled={form.state.isSubmitting}>
        继续
        {form.state.isSubmitting ? (
          <Loader2 className='animate-spin' />
        ) : (
          <ArrowRight />
        )}
      </Button>
    </form>
  )
}
