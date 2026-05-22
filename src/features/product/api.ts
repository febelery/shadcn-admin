import axios from 'axios'
import { sleep } from '@/lib/utils'
import type { Product } from './data/schema'

export interface ProductListResponse {
  data: Product[]
  meta?: {
    total: number
    page?: number
    pageSize?: number
  }
}

export const getProductList = async (): Promise<ProductListResponse> => {
  await sleep(200)
  const response = await axios.get('/api/product')
  return response.data
}

export const createProduct = async (product: Product): Promise<Product> => {
  const response = await axios.post('/api/product', product)
  return response.data
}

export const deleteProduct = async (ids: string[]): Promise<void> => {
  await axios.delete('/api/product', { data: { ids } })
}
