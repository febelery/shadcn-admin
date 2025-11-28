import axios from 'axios'
import { type PaginatedResponse, type QueryParams } from '@/types/api'
import { type Task } from './data/schema'

export const getTasks = async (
  params?: QueryParams
): Promise<PaginatedResponse<Task>> => {
  const response = await axios.get('/api/tasks', { params })
  return response.data
}
