import axios from 'axios'
import { type PaginatedResponse, type QueryParams } from '@/types/api'
import { type Task } from './data/schema'

export const getTaskList = async (
  params?: QueryParams
): Promise<PaginatedResponse<Task>> => {
  const response = await axios.get('/api/task', { params })
  return response.data
}
