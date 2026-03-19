import axios from 'axios'

export interface Role {
  id: string
  name: string
  label: string
  description: string
  permissions: string[]
  userCount: number
  createdAt: string
  updatedAt: string
}

export interface AvailablePermission {
  key: string
  label: string
  group: string
}

export interface CreateRolePayload {
  name: string
  label: string
  description: string
  permissions: string[]
}

export interface UpdateRolePayload {
  label?: string
  description?: string
  permissions?: string[]
}

export const getRoles = async (): Promise<Role[]> => {
  const response = await axios.get('/api/roles')
  return response.data
}

export const getRole = async (id: string): Promise<Role> => {
  const response = await axios.get(`/api/roles/${id}`)
  return response.data
}

export const createRole = async (payload: CreateRolePayload): Promise<Role> => {
  const response = await axios.post('/api/roles', payload)
  return response.data
}

export const updateRole = async (
  id: string,
  payload: UpdateRolePayload
): Promise<Role> => {
  const response = await axios.put(`/api/roles/${id}`, payload)
  return response.data
}

export const deleteRole = async (id: string): Promise<void> => {
  await axios.delete(`/api/roles/${id}`)
}

export const getAvailablePermissions = async (): Promise<
  AvailablePermission[]
> => {
  const response = await axios.get('/api/permissions/available')
  return response.data
}
