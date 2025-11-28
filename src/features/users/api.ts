import axios from 'axios'
import { type PaginatedResponse, type QueryParams } from '@/types/api'
import { type User } from './data/schema'

export const getUsers = async (
  params?: QueryParams
): Promise<PaginatedResponse<User>> => {
  const response = await axios.get('/api/users', { params })
  return response.data
}
