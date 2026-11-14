export type ProductVariant = {
  id: string
  label: string
  price: number
}

export type Product = {
  id: string
  name: string
  category: string
  description: string
  art: string
  variants: ProductVariant[]
}

export type Store = {
  id: string
  brand: string
  eyebrow: string
  headline: string
  intro: string
  accent: string
  categories: string[]
  products: Product[]
}

export type CartLine = {
  key: string
  productId: string
  variantId: string
  quantity: number
}
