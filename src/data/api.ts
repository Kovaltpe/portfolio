import type { Store, CartLine } from './types'

const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
  })
  const payload = (await response.json()) as T & { error?: string }
  if (!response.ok) {
    throw new Error(payload.error || 'The request could not be completed.')
  }
  return payload
}

export async function fetchStore(storeId: string) {
  const response = await fetch('/catalog.json')
  if (!response.ok) throw new Error('The sample product catalog could not be loaded.')
  const catalog = (await response.json()) as Record<string, Store>
  const store = catalog[storeId]
  if (!store) throw new Error('Store not found.')
  return store
}

export function placeDemoOrder(order: {
  storeId: string
  name: string
  email: string
  items: Pick<CartLine, 'productId' | 'variantId' | 'quantity'>[]
}) {
  return apiRequest<{
    ok: boolean
    orderId: string
    total: number
    currency: string
    note: string
  }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  })
}
