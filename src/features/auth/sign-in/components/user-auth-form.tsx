import { useTransition } from 'react'
import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
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
  const [isPending, startTransition] = useTransition()

  const form = useForm({
    defaultValues: {
      name: '',
      password: '',
    },
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      startTransition(async () => {
        try {
          await auth.login(value)
          queryClient.clear()

          toast.success(`欢迎回来, ${value.name}!`)

          // 跳转回之前的页面，默认为首页
          const targetPath = redirectTo || '/'
          navigate({ to: targetPath, replace: true })
        } catch (error: any) {
          if (error && error.message) {
            toast.error(error.message)
          } else {
            toast.error('登录失败，请重试。')
          }
          console.error(error)
        }
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

      <RainbowButton className='mt-2' disabled={isPending}>
        {isPending ? <Loader2 className='animate-spin' /> : <LogIn />}
        登录
      </RainbowButton>
    </form>
  )
}
