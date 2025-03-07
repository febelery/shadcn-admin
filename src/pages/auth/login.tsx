import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'
import { BackgroundBlob } from '@/components/ui/background-blob'
import { NeonGradientCard } from '@/components/magicui/neon-gradient-card'
import { LoginForm } from './components/login-form'
import OtpInput from './components/otp-input'
import OtpScan from './components/otp-scan'

export default function Login() {
  const navigate = useNavigate()
  const [state, setState] = useState({
    needOtp: false,
    qrCodeUrl: '',
    otpKey: '',
  })

  let OtpType = 'scan' // input|scan two-factor 验证

  const handleLoginSuccess = useCallback(
    (response: any) => {
      if (response.need_otp) {
        setState({
          needOtp: true,
          qrCodeUrl: 'https://example.com/qr-code',
          otpKey: response.otp_key,
        })
      } else if (response.token) {
        useAuthStore.getState().setToken(response.token)
        useAuthStore.getState().setUser(response)
        toast.success('登录成功')
        navigate({
          to: useAuthStore.getState().getRedirectAfterLogin(),
          replace: true,
        })
      }
    },
    [navigate]
  )

  const handleLoginError = useCallback((error: string) => {
    console.error('登录失败:', error)
  }, [])

  const handleBackToLogin = useCallback(() => {
    setState({
      needOtp: false,
      qrCodeUrl: '',
      otpKey: '',
    })
  }, [])

  return (
    <BackgroundBlob>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <NeonGradientCard className='w-[420px]'>
          <AnimatePresence mode='wait'>
            {!state.needOtp ? (
              <LoginForm
                onLoginSuccess={handleLoginSuccess}
                onLoginError={handleLoginError}
              />
            ) : OtpType === 'scan' ? (
              <OtpScan
                qrCodeUrl={state.qrCodeUrl}
                otpKey={state.otpKey}
                onBack={handleBackToLogin}
                onVerificationComplete={handleLoginSuccess}
              />
            ) : (
              <OtpInput
                otpKey={state.otpKey}
                onBack={handleBackToLogin}
                onVerificationComplete={handleLoginSuccess}
                onVerificationError={handleLoginError}
              />
            )}
          </AnimatePresence>
        </NeonGradientCard>
      </motion.div>
    </BackgroundBlob>
  )
}
