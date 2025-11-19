import axios from 'axios'
import { User } from './data/schema'

export const getUsers = async (): Promise<User[]> => {
  const response = await axios.get('/api/users')
  return response.data
}
