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
import { OtpForm } from './components/otp-form'

export function Otp() {
  return (
    <AuthLayout>
      <Card className='p-6'>
        <CardHeader className='flex flex-col items-center space-y-2 text-center'>
          <CardTitle className='text-2xl font-semibold tracking-tight'>
            双重验证
          </CardTitle>
          <CardDescription className='text-muted-foreground text-sm'>
            请输入验证码。我们已将验证码发送至您的邮箱
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <OtpForm />
        </CardContent>
      </Card>
      <p className='text-muted-foreground px-8 text-center text-sm'>
        没有收到？{' '}
        <Link
          to={ROUTES.SIGN_IN}
          className='hover:text-primary underline underline-offset-4'
        >
          重新发送验证码
        </Link>
        .
      </p>
    </AuthLayout>
  )
}
