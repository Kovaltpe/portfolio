const MAX_BODY_BYTES = 100_000

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}

async function readJson(request) {
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    throw new HttpError(413, 'Request is too large.')
  }
  try {
    return JSON.parse(raw || '{}')
  } catch {
    throw new HttpError(400, 'Please send valid JSON.')
  }
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

async function loadCatalog(request, env) {
  const catalogUrl = new URL('/catalog.json', request.url)
  const response = await env.ASSETS.fetch(new Request(catalogUrl))
  if (!response.ok) throw new Error('The sample product catalog is unavailable.')
  return response.json()
}

async function createDemoOrder(request, env) {
  const body = await readJson(request)
  const name = cleanText(body.name, 100)
  const email = cleanText(body.email, 254).toLowerCase()
  const storeId = cleanText(body.storeId, 80)
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'Please enter your name and a valid email.')
  }
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
    throw new HttpError(400, 'Your basket is empty or contains too many different items.')
  }

  const catalog = await loadCatalog(request, env)
  const store = catalog[storeId]
  if (!store) throw new HttpError(400, 'Store not found.')

  const items = []
  for (const item of body.items) {
    const product = store.products.find((entry) => entry.id === item.productId)
    const variant = product?.variants.find((entry) => entry.id === item.variantId)
    const quantity = Number(item.quantity)
    if (!product || !variant || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new HttpError(400, 'One or more basket items are invalid.')
    }
    items.push({
      productId: product.id,
      productName: product.name,
      variantId: variant.id,
      variantLabel: variant.label,
      quantity,
      unitPrice: variant.price,
    })
  }

  const order = {
    id: crypto.randomUUID(),
    storeId,
    storeName: store.brand,
    items,
    total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    currency: 'EUR',
    paymentStatus: 'not-configured-demo',
    receivedAt: new Date().toISOString(),
  }

  const statements = [
    env.DB.prepare(
      `INSERT INTO demo_orders
        (id, store_id, store_name, total, currency, payment_status, received_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      order.id,
      order.storeId,
      order.storeName,
      order.total,
      order.currency,
      order.paymentStatus,
      order.receivedAt,
    ),
    ...items.map((item) =>
      env.DB.prepare(
        `INSERT INTO demo_order_items
          (order_id, product_id, product_name, variant_id, variant_label, quantity, unit_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        order.id,
        item.productId,
        item.productName,
        item.variantId,
        item.variantLabel,
        item.quantity,
        item.unitPrice,
      ),
    ),
  ]
  await env.DB.batch(statements)

  return jsonResponse(201, {
    ok: true,
    orderId: order.id,
    total: order.total,
    currency: order.currency,
    note: 'Demo order recorded; no payment was taken.',
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    try {
      if (url.pathname === '/api/health' && request.method === 'GET') {
        return jsonResponse(200, { ok: true })
      }

      if (url.pathname === '/api/products' && request.method === 'GET') {
        const catalog = await loadCatalog(request, env)
        const store = catalog[url.searchParams.get('store')]
        if (!store) return jsonResponse(404, { error: 'Store not found.' })
        return jsonResponse(200, store)
      }

      if (url.pathname === '/api/orders' && request.method === 'POST') {
        return await createDemoOrder(request, env)
      }

      if (url.pathname.startsWith('/api/')) {
        return jsonResponse(404, { error: 'Endpoint not found.' })
      }

      return env.ASSETS.fetch(request)
    } catch (error) {
      if (error instanceof HttpError) return jsonResponse(error.status, { error: error.message })
      console.error('Demo API request failed:', error)
      return jsonResponse(500, { error: 'Something went wrong. Please try again.' })
    }
  },
}
