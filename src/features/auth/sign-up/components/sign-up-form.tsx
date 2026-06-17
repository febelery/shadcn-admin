import { useTransition } from 'react'
import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { IconGmail, IconGithub } from '@/assets/brand-icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

// 校验密码是否匹配的 Zod Schema
const formSchema = z
  .object({
    name: z.string().min(2, '账号长度至少为 2 个字符'),
    password: z
      .string()
      .min(1, '请输入您的密码')
      .min(7, '密码长度至少为 7 个字符'),
    confirmPassword: z.string().min(1, '请确认您的密码'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '密码不匹配。',
    path: ['confirmPassword'],
  })

export function SignUpForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [isPending, startTransition] = useTransition()

  const form = useForm({
    defaultValues: {
      name: '',
      password: '',
      confirmPassword: '',
    },
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      startTransition(async () => {
        console.log(value)
        await new Promise((resolve) => setTimeout(resolve, 3000))
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
      className={cn('grid gap-3', className)}
      {...props}
    >
      {/* 账号 */}
      <form.Field
        name='name'
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>账号</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value || ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder='请输入您的账号'
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      {/* 密码 */}
      <form.Field
        name='password'
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>密码</FieldLabel>
              <PasswordInput
                id={field.name}
                name={field.name}
                value={field.state.value || ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder='********'
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      {/* 确认密码 */}
      <form.Field
        name='confirmPassword'
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>确认密码</FieldLabel>
              <PasswordInput
                id={field.name}
                name={field.name}
                value={field.state.value || ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder='********'
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      <Button className='mt-2' disabled={isPending}>
        创建账户
      </Button>

      <div className='relative my-2'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-background text-muted-foreground px-2'>
            或继续使用
          </span>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-2'>
        <Button
          variant='outline'
          className='w-full'
          type='button'
          disabled={isPending}
        >
          <IconGithub className='h-4 w-4' /> GitHub
        </Button>
        <Button
          variant='outline'
          className='w-full'
          type='button'
          disabled={isPending}
        >
          <IconGmail className='h-4 w-4' /> Google
        </Button>
      </div>
    </form>
  )
}
