export type CategoryStatus = 'ACTIVE' | 'INACTIVE'

export type Category = {
  id: number
  name: string
  description?: string
  status: CategoryStatus
  createdAt: string
  updatedAt: string
}

export type CategoriesResponse = {
  message: string
  categories: Category[]
}
