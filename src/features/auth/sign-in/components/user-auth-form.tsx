import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { cn } from 'cn'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { PasswordInput } from '@/components/password-input'

const formSchema = z.object({
  name: z.string().min(2, '账号最少 2 个字符'),
  password: z.string().min(7, '密码最少 7 个字符'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAuthStore()

  const form = useForm({
    defaultValues: {
      name: '',
      password: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await auth.login(value)
        queryClient.clear()

        toast.success(`欢迎回来, ${value.name}!`)

        // 跳转回之前的页面，默认为首页
        const targetPath = redirectTo || '/'
        navigate({ to: targetPath, replace: true })
      } catch (error: any) {
        const message =
          error?.response?.data?.msg || error?.message || '登录失败，请重试。'
        toast.error(message)
        console.error(error)
      }
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
          const isInvalid =
            field.state.meta.errors.length > 0 &&
            (field.state.meta.isTouched || form.state.submissionAttempts > 0)
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
          const isInvalid =
            field.state.meta.errors.length > 0 &&
            (field.state.meta.isTouched || form.state.submissionAttempts > 0)
          return (
            <Field data-invalid={isInvalid} className='relative'>
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

      <form.Subscribe
        selector={(state) => state.isSubmitting}
        children={(isSubmitting) => (
          <RainbowButton type='submit' className='mt-2' disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className='animate-spin' /> : <LogIn />}
            登录
          </RainbowButton>
        )}
      />
    </form>
  )
}
