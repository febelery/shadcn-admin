import axios from 'axios'
import { type User } from './data/schema'
import { type PaginatedResponse, type QueryParams } from '@/types/api'

export const getUsers = async (
  params?: QueryParams
): Promise<PaginatedResponse<User>> => {
  const response = await axios.get('/api/users', { params })
  return response.data
}
