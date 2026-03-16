import { Link } from '@tanstack/react-router'
import { ROUTES } from '@/constants'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { SignUpForm } from './components/sign-up-form'

export function SignUp() {
  return (
    <AuthLayout>
      <Card className='p-6'>
        <CardHeader className='flex flex-col items-center space-y-2 text-center'>
          <CardTitle className='text-2xl font-semibold tracking-tight'>
            创建账户
          </CardTitle>
          <CardDescription className='text-muted-foreground text-sm'>
            输入您的账号和密码以创建账户
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <SignUpForm />
        </CardContent>
      </Card>
      <p className='text-muted-foreground px-8 text-center text-sm'>
        已有账户？{' '}
        <Link
          to={ROUTES.SIGN_IN}
          className='hover:text-primary underline underline-offset-4'
        >
          登录
        </Link>
        . 创建账户即表示您同意我们的{' '}
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
