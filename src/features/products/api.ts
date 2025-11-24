import axios from 'axios'
import type { Product } from './data/schema'

export interface ProductsResponse {
  data: Product[]
  meta?: {
    total: number
    page?: number
    pageSize?: number
  }
}

export const getProducts = async (): Promise<ProductsResponse> => {
  const response = await axios.get('/api/products')
  return response.data
}

export const createProduct = async (product: Product): Promise<Product> => {
  const response = await axios.post('/api/products', product)
  return response.data
}

export const deleteProducts = async (ids: string[]): Promise<void> => {
  await axios.delete('/api/products', { data: { ids } })
}

