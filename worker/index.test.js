import assert from 'node:assert/strict'
import test from 'node:test'
import worker from './index.js'

const catalog = {
  'paw-pantry': {
    id: 'paw-pantry',
    brand: 'Paw & Pantry',
    products: [
      {
        id: 'trail-mix',
        name: 'Trail Mix',
        variants: [{ id: '1kg', label: '1 kg', price: 1290 }],
      },
    ],
  },
}

function createEnvironment() {
  const statements = []
  const env = {
    ASSETS: {
      async fetch(request) {
        if (new URL(request.url).pathname === '/catalog.json') {
          return Response.json(catalog)
        }
        return new Response('<main>Portfolio</main>', {
          headers: { 'content-type': 'text/html' },
        })
      },
    },
    DB: {
      prepare(query) {
        return {
          query,
          values: [],
          bind(...values) {
            this.values = values
            return this
          },
        }
      },
      async batch(batchStatements) {
        statements.push(...batchStatements)
        return []
      },
    },
  }
  return { env, statements }
}

test('Worker serves health and delegates site routes to static assets', async () => {
  const { env } = createEnvironment()
  const health = await worker.fetch(new Request('https://example.test/api/health'), env)
  assert.equal(health.status, 200)
  assert.deepEqual(await health.json(), { ok: true })

  const page = await worker.fetch(new Request('https://example.test/demo/paw-pantry'), env)
  assert.equal(page.status, 200)
  assert.match(await page.text(), /Portfolio/)
})

test('Worker serves a product catalog and rejects unknown stores', async () => {
  const { env } = createEnvironment()
  const products = await worker.fetch(
    new Request('https://example.test/api/products?store=paw-pantry'),
    env,
  )
  assert.equal(products.status, 200)
  assert.equal((await products.json()).products[0].id, 'trail-mix')

  const missingStore = await worker.fetch(
    new Request('https://example.test/api/products?store=unknown'),
    env,
  )
  assert.equal(missingStore.status, 404)
})

test('Worker validates orders, saves only demo order data, and recalculates totals', async () => {
  const { env, statements } = createEnvironment()
  const response = await worker.fetch(
    new Request('https://example.test/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        storeId: 'paw-pantry',
        name: 'Demo Tester',
        email: 'demo@example.com',
        items: [{ productId: 'trail-mix', variantId: '1kg', quantity: 2 }],
      }),
    }),
    env,
  )

  assert.equal(response.status, 201)
  const result = await response.json()
  assert.equal(result.total, 2580)
  assert.match(result.note, /no payment/i)
  assert.equal(statements.length, 2)
  assert.equal(JSON.stringify(statements).includes('demo@example.com'), false)
  assert.equal(JSON.stringify(statements).includes('Demo Tester'), false)
})

test('Worker rejects invalid product variants without recording an order', async () => {
  const { env, statements } = createEnvironment()
  const response = await worker.fetch(
    new Request('https://example.test/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        storeId: 'paw-pantry',
        name: 'Demo Tester',
        email: 'demo@example.com',
        items: [{ productId: 'trail-mix', variantId: 'invalid', quantity: 2 }],
      }),
    }),
    env,
  )

  assert.equal(response.status, 400)
  assert.equal(statements.length, 0)
})
