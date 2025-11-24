import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import type { Product } from '@/features/products/data/schema'

faker.seed(2024)

const categories = [
  'electronics',
  'clothing',
  'food',
  'books',
  'toys',
  'furniture',
] as const

const brands = [
  'TechCorp',
  'FashionHub',
  'Foodie',
  'BookStore',
  'ToyLand',
  'HomeStyle',
]

const tags = ['新品', '热销', '推荐', '限时', '特价', '环保', '优质', '经典']

// 使用 Map 来存储产品数据，模拟服务器状态
const productsMap = new Map<string, Product>()

// 初始化产品数据
Array.from({ length: 100 }, () => {
  const category = faker.helpers.arrayElement(categories)
  const stock = faker.number.int({ min: 0, max: 1000 })
  const price = faker.number.float({ min: 10, max: 5000, fractionDigits: 2 })
  const rating = faker.number.float({ min: 1, max: 5, fractionDigits: 1 })
  const tagCount = faker.number.int({ min: 1, max: 3 })
  const selectedTags = faker.helpers.arrayElements(tags, tagCount)

  const product: Product = {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    category,
    brand: faker.helpers.arrayElement(brands),
    price,
    stock,
    inStock: stock > 0,
    tags: selectedTags,
    rating,
    releaseDate: faker.date
      .between({
        from: new Date(2020, 0, 1),
        to: new Date(),
      })
      .toISOString()
      .split('T')[0],
    imageUrl: faker.image.url(),
  }
  productsMap.set(product.id, product)
  return product
})

export const productsHandlers = [
  http.get('/api/products', async () => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const products = Array.from(productsMap.values())
    return HttpResponse.json({
      data: products,
      meta: {
        total: products.length,
      },
    })
  }),

  http.delete('/api/products', async ({ request }) => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const body = (await request.json()) as { ids: string[] }
    body.ids.forEach((id) => {
      productsMap.delete(id)
    })
    return HttpResponse.json({ success: true })
  }),
]
