import type { Category } from '../categories/types'

export type ProductStatus = 'ACTIVE' | 'INACTIVE'

export type ProductSort = 'latest' | 'price_asc' | 'price_desc'

export type ProductAttachment = {
  id: string
  filename: string
  url: string
  contentType: string
}

export type Product = {
  id: number
  categoryId: number
  name: string
  description: string
  price: string
  stock: number
  isFeatured: boolean
  status: ProductStatus
  category: Category
  attachments: ProductAttachment[]
  ratingAverage: number
  reviewsCount: number
  createdAt: string
  updatedAt: string
}

export type ProductsQuery = {
  categoryId?: number
  page?: number
  limit?: number
  sort?: ProductSort
}

export type ProductsResponse = {
  message: string
  products: Product[]
  total: number
  page: number
  limit: number
}
