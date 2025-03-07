import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { verifyOtpApi } from '@/services/user'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { RainbowButton } from '@/components/magicui/rainbow-button'
import { PinInput, PinInputField } from '@/components/pin-input'

const formSchema = z.object({
  otp: z.string().min(6, { message: '请输入完整的验证码' }),
})

interface OtpInputProps {
  otpKey: string
  onBack: () => void
  onVerificationComplete: (response: any) => void
  onVerificationError: (error: string) => void
}

export default function OtpInput({
  otpKey,
  onBack,
  onVerificationComplete,
  onVerificationError,
}: OtpInputProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [disabledBtn, setDisabledBtn] = useState(true)
  const [error, setError] = useState<string>('')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      setError('')
      // 这里添加验证码验证的 API 调用
      const response = await verifyOtpApi(otpKey, data.otp)
      onVerificationComplete(response)
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || '验证失败，请重试'
      setError(errorMessage)
      onVerificationError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      key='otp'
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
          <ShieldCheck className='text-primary h-8 w-8' />
        </motion.div>
        <CardTitle className='text-center text-xl font-medium'>
          二次验证
        </CardTitle>
        {/* <p className='text-muted-foreground text-center text-sm'>
          请输入一次性验证码
        </p> */}
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
            <FormField
              control={form.control}
              name='otp'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormControl>
                    <PinInput
                      {...field}
                      className='flex h-10 justify-between'
                      onComplete={() => setDisabledBtn(false)}
                      onIncomplete={() => setDisabledBtn(true)}
                    >
                      {Array.from({ length: 7 }, (_, i) => {
                        if (i === 3)
                          return <Separator key={i} orientation='vertical' />
                        return (
                          <PinInputField
                            key={i}
                            component={Input}
                            className={cn(
                              form.getFieldState('otp').invalid
                                ? 'border-red-500'
                                : '',
                              'w-12'
                            )}
                          />
                        )
                      })}
                    </PinInput>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <p className='text-center text-xs text-red-500'>{error}</p>
            )}

            <div className='flex gap-1'>
              <RainbowButton
                type='submit'
                className='h-10 flex-7'
                disabled={disabledBtn || isLoading}
              >
                验证
              </RainbowButton>

              <Button
                variant='ghost'
                className='text-muted-foreground flex-1 text-sm'
                onClick={onBack}
              >
                返回
              </Button>
            </div>
          </form>
        </Form>

        {/* <div className='text-center'>
          <Button
            variant='ghost'
            className='text-muted-foreground text-sm'
            onClick={onBack}
          >
            返回
          </Button>
        </div> */}

        {/* <div className='text-muted-foreground mt-4 text-center text-sm'>
          没有收到验证码？{' '}
          <Link to='/sign-in' className='text-primary hover:underline'>
            重新发送
          </Link>
        </div> */}
      </CardContent>
    </motion.div>
  )
}
