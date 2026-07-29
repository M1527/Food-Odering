export type CartProduct = {
  id: number
  name: string
  price: string
  stock: number
}

export type CartItem = {
  product: CartProduct
  quantity: number
  subtotal: string
}

export type Cart = {
  items: CartItem[]
  total: string
}

export type AddCartItemInput = {
  productId: number
  quantity: number
}

export type UpdateCartItemInput = {
  productId: number
  quantity: number
}

export type CartMutationResponse = {
  message: string
  cart: Cart
}
