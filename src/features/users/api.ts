import axios from 'axios'
import { type User } from './data/schema'

export const getUsers = async (): Promise<User[]> => {
  const response = await axios.get('/api/users')
  return response.data
}
