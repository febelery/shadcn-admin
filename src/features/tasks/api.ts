import axios from 'axios'
import { Task } from './data/schema'

export const getTasks = async (): Promise<Task[]> => {
  const response = await axios.get('/api/tasks')
  return response.data
}
