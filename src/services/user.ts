import axios from 'axios'

export const LoginApi = (username: string, password: string): any => {
  return axios.post('/auth/admin', { username, password })
}

export const verifyOtpApi = (
  otpKey: string,
  otpValue: string | null = null
): any => {
  return axios.post('/auth/admin/otp', { otp_key: otpKey, otp_value: otpValue })
}

export const UserInfoApi = (): any => {
  return axios.get('/user/info')
}
