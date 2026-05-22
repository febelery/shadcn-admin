import axios from 'axios'
import { type PaginatedResponse, type QueryParams } from '@/types/api'
import { type User } from './data/schema'

export const getUserList = async (
  params?: QueryParams
): Promise<PaginatedResponse<User>> => {
  const response = await axios.get('/api/user', { params })
  return response.data
}
