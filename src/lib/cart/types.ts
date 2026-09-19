export interface CartLine {
  productId: string
  quantity: number
  addedAt: string
}

export interface CartState {
  lines: CartLine[]
}
