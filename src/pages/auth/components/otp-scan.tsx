import { useCallback, useEffect, useState, useRef } from 'react'
import { verifyOtpApi } from '@/services/user'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const QRCODE_EXPIRE = 60
const OTP_POLL_INTERVAL = 2000

interface OtpScanProps {
  qrCodeUrl: string
  otpKey: string
  onBack: () => void
  onVerificationComplete: (response: any) => void
}

export default function OtpScan({
  qrCodeUrl,
  otpKey,
  onBack,
  onVerificationComplete,
}: OtpScanProps) {
  const [countdown, setCountdown] = useState(QRCODE_EXPIRE)
  const pollIntervalRef = useRef<{
    pollInterval: NodeJS.Timeout | null
    cleanupTimeout: NodeJS.Timeout | null
  }>({ pollInterval: null, cleanupTimeout: null })

  const clearAllTimers = useCallback(() => {
    if (pollIntervalRef.current.pollInterval) {
      clearInterval(pollIntervalRef.current.pollInterval)
      pollIntervalRef.current.pollInterval = null
    }
    if (pollIntervalRef.current.cleanupTimeout) {
      clearTimeout(pollIntervalRef.current.cleanupTimeout)
      pollIntervalRef.current.cleanupTimeout = null
    }
  }, [])

  useEffect(() => {
    pollIntervalRef.current.pollInterval = setInterval(async () => {
      try {
        const response = await verifyOtpApi(otpKey)
        if (response.token) {
          clearAllTimers()
          onVerificationComplete(response)
        }
      } catch (error) {
        console.error('二次验证检查失败:', error)
      }
    }, OTP_POLL_INTERVAL)

    pollIntervalRef.current.cleanupTimeout = setTimeout(() => {
      clearAllTimers()
    }, QRCODE_EXPIRE * 1000)

    return () => {
      clearAllTimers()
    }
  }, [otpKey, clearAllTimers, onVerificationComplete])

  useEffect(() => {
    if (countdown <= 0) {
      clearAllTimers()
      onBack()
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown, onBack, clearAllTimers])

  return (
    <motion.div
      key='2fa'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CardHeader className='space-y-3 pb-4'>
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className='mx-auto mb-2 h-16 w-16'
        >
          <div className='relative h-full w-full'>
            <div className='border-muted absolute inset-0 h-full w-full rounded-full border-4' />
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='flex items-baseline'>
                <span className='text-xl font-semibold'>{countdown}</span>
              </div>
            </div>
            <svg
              className='absolute inset-0 h-full w-full rotate-[-90deg]'
              viewBox='0 0 100 100'
            >
              <circle
                className='transition-all duration-1000 ease-linear'
                cx='50'
                cy='50'
                r='48'
                fill='none'
                stroke='currentColor'
                strokeWidth='4'
                strokeDasharray={`${(countdown / QRCODE_EXPIRE) * 301} 301`}
                strokeLinecap='round'
              />
            </svg>
          </div>
        </motion.div>
        <CardTitle className='text-center text-xl font-medium'>
          二次验证
        </CardTitle>
        <p className='text-muted-foreground text-center text-sm'>
          请使用微信扫描二维码
        </p>
      </CardHeader>

      <CardContent className='space-y-6'>
        <div className='flex justify-center'>
          <QRCodeSVG
            value={qrCodeUrl}
            size={192}
            level='H'
            marginSize={1}
            className='rounded-lg bg-white p-2'
          />
        </div>

        <div className='text-center'>
          <Button
            variant='ghost'
            className='text-muted-foreground text-sm'
            onClick={onBack}
          >
            返回
          </Button>
        </div>
      </CardContent>
    </motion.div>
  )
}
