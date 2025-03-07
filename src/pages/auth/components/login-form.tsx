import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoginApi } from '@/services/user'
import { motion } from 'framer-motion'
import { LockIcon, UserIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RainbowButton } from '@/components/magicui/rainbow-button'

const loginFormSchema = z.object({
  username: z.string().min(2, { message: '用户名至少需要2个字符' }),
  password: z.string().min(4, { message: '密码至少需要4个字符' }),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>

interface LoginResponse {
  need_otp?: boolean
  otp_key?: string
  token?: string
  // ... 其他响应字段
}

interface LoginFormProps {
  onLoginSuccess: (response: LoginResponse) => void
  onLoginError: (error: string) => void
}

export function LoginForm({ onLoginSuccess, onLoginError }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string>('')

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const handleSubmit = async (formValues: LoginFormValues) => {
    try {
      setError('')
      const response = await LoginApi(formValues.username, formValues.password)
      onLoginSuccess(response)
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || '登录失败，请稍后重试'
      setError(errorMessage)
      onLoginError(errorMessage)
    }
  }

  return (
    <motion.div
      key='login'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CardHeader className='space-y-3 pb-4'>
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className='bg-primary/10 mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full'
        >
          <LockIcon className='text-primary h-8 w-8' />
        </motion.div>
        <CardTitle className='text-center text-xl font-medium'>登录</CardTitle>
        {/* <p className='text-muted-foreground text-center text-sm'>
          请输入您的账号信息
        </p> */}
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-5'
          >
            <FormField
              control={form.control}
              name='username'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户名</FormLabel>
                  <div className='relative'>
                    <UserIcon className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                    <FormControl>
                      <Input className='h-10 pl-9' {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <div className='flex items-center justify-between'>
                    <FormLabel>密码</FormLabel>
                    {/* <Link
                      to='/forgot-password'
                      tabIndex={-1}
                      className='text-primary text-xs hover:underline'
                    >
                      忘记密码?
                    </Link> */}
                  </div>
                  <div className='relative'>
                    <LockIcon className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        className='h-10 pr-9 pl-9'
                        {...field}
                      />
                    </FormControl>
                    <button
                      type='button'
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transform'
                    >
                      {showPassword ? (
                        <EyeOffIcon className='h-4 w-4' />
                      ) : (
                        <EyeIcon className='h-4 w-4' />
                      )}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && <p className='text-xs text-red-500'>{error}</p>}

            <RainbowButton type='submit' className='h-10 w-full'>
              登录
            </RainbowButton>
          </form>
        </Form>

        <div className='text-muted-foreground mt-4 text-center text-sm'>
          {/* 还没有账号?{' '}
          <Link to='/sign-up' className='text-primary hover:underline'>
            联系我们
          </Link> */}
          点击登录表示您同意我们隐私协议
        </div>
      </CardContent>
    </motion.div>
  )
}
