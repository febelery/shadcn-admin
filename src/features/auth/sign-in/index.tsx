import { useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <Card className='p-6'>
        <CardHeader className='flex flex-col items-center space-y-2 text-center'>
          <CardTitle className='text-2xl font-semibold tracking-tight'>
            登录账户
          </CardTitle>
          <CardDescription className='text-muted-foreground text-sm'>
            输入您的账号和密码以登录
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
      </Card>
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
