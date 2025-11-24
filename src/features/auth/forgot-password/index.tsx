import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { ForgotPasswordForm } from './components/forgot-password-form'

export function ForgotPassword() {
  return (
    <AuthLayout>
      <Card className='p-6'>
        <CardHeader className='flex flex-col items-center space-y-2 text-center'>
          <CardTitle className='text-2xl font-semibold tracking-tight'>
            忘记密码
          </CardTitle>
          <CardDescription className='text-muted-foreground text-sm'>
            输入您注册的邮箱，我们将向您发送重置密码的链接
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
      <p className='text-muted-foreground px-8 text-center text-sm'>
        还没有账户？{' '}
        <Link
          to='/sign-up'
          className='hover:text-primary underline underline-offset-4'
        >
          注册
        </Link>
        .
      </p>
    </AuthLayout>
  )
}
