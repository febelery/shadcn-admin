import { useSearch } from '@tanstack/react-router'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <div className='flex flex-col space-y-2 text-center'>
        <h1 className='text-2xl font-semibold tracking-tight'>登录账户</h1>
        <p className='text-muted-foreground text-sm'>
          请输入您的账号和密码以登录
        </p>
      </div>
      <UserAuthForm redirectTo={redirect} />
      <p className='text-muted-foreground px-8 text-center text-sm'>
        点击登录即表示您同意我们的{' '}
        <a
          href='/terms'
          className='hover:text-primary underline underline-offset-4'
        >
          服务条款
        </a>{' '}
        和{' '}
        <a
          href='/privacy'
          className='hover:text-primary underline underline-offset-4'
        >
          隐私政策
        </a>
        .
      </p>
    </AuthLayout>
  )
}
