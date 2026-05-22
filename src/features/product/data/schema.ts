export interface Product {
  id: string
  name: string
  description?: string
  category: 'electronics' | 'clothing' | 'food' | 'books' | 'toys' | 'furniture'
  brand?: string
  price: number
  stock: number
  inStock: boolean
  tags: string[]
  rating?: number
  releaseDate?: string
  imageUrl?: string
}
