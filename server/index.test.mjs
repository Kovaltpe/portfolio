import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))

async function getFreePort() {
  const server = createServer()
  await new Promise((resolveListen, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolveListen)
  })
  const port = server.address().port
  await new Promise((resolveClose, reject) => {
    server.close((error) => (error ? reject(error) : resolveClose()))
  })
  return port
}

async function waitForApi(baseUrl, child) {
  const deadline = Date.now() + 7000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Demo API exited before it was ready.')
    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) return
    } catch {
      await new Promise((resolveWait) => setTimeout(resolveWait, 100))
    }
  }
  throw new Error('Demo API did not become ready in time.')
}

test('demo API serves catalog, validates totals and records sample orders without personal data', async () => {
  const port = await getFreePort()
  const dataDirectory = await mkdtemp(resolve(tmpdir(), 'andrey-portfolio-api-'))
  const baseUrl = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, ['server/index.mjs'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(port), DATA_DIR: dataDirectory },
    stdio: 'ignore',
  })

  try {
    await waitForApi(baseUrl, child)

    const catalogResponse = await fetch(`${baseUrl}/api/products?store=paw-pantry`)
    assert.equal(catalogResponse.status, 200)
    const store = await catalogResponse.json()
    assert.equal(store.products.length, 6)

    const orderResponse = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        storeId: 'paw-pantry',
        name: 'Demo Tester',
        email: 'demo@example.com',
        items: [{ productId: 'trail-mix', variantId: '1kg', quantity: 2 }],
      }),
    })
    assert.equal(orderResponse.status, 201)
    const orderResult = await orderResponse.json()
    assert.equal(orderResult.total, 2580)
    assert.match(orderResult.note, /no payment/i)

    const invalidOrder = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        storeId: 'paw-pantry',
        name: 'Demo Tester',
        email: 'demo@example.com',
        items: [{ productId: 'trail-mix', variantId: 'invalid', quantity: 2 }],
      }),
    })
    assert.equal(invalidOrder.status, 400)

    const orders = JSON.parse(await readFile(resolve(dataDirectory, 'orders.json'), 'utf8'))
    assert.equal(orders.length, 1)
    assert.equal(orders[0].total, 2580)
    assert.equal('customer' in orders[0], false)
  } finally {
    child.kill()
    await rm(dataDirectory, { recursive: true, force: true })
  }
})
