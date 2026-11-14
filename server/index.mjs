import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const catalogPath = resolve(projectRoot, 'public/catalog.json')
const staticDirectory = resolve(projectRoot, 'dist')
const dataDirectory = resolve(process.env.DATA_DIR || resolve(projectRoot, 'server/data'))
const port = Number(process.env.PORT || 8787)
const allowedOrigin = process.env.CORS_ORIGIN || '*'

async function loadCatalog() {
  return JSON.parse(await readFile(catalogPath, 'utf8'))
}

async function saveRecord(filename, record) {
  await mkdir(dataDirectory, { recursive: true })
  const path = resolve(dataDirectory, filename)
  let records = []
  try {
    records = JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  records.push(record)
  await writeFile(path, JSON.stringify(records, null, 2), 'utf8')
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  response.end(JSON.stringify(body))
}

async function readJson(request) {
  let raw = ''
  for await (const chunk of request) {
    raw += chunk
    if (raw.length > 100_000) throw new Error('Request is too large.')
  }
  try {
    return JSON.parse(raw || '{}')
  } catch {
    throw new Error('Please send valid JSON.')
  }
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

async function serveStatic(pathname, request, response) {
  const decodedPath = decodeURIComponent(pathname)
  let filePath = resolve(staticDirectory, `.${decodedPath}`)
  if (filePath !== staticDirectory && !filePath.startsWith(`${staticDirectory}${sep}`)) {
    sendJson(response, 400, { error: 'Invalid path.' })
    return
  }

  try {
    const fileInfo = await stat(filePath)
    if (!fileInfo.isFile()) filePath = resolve(staticDirectory, 'index.html')
  } catch {
    filePath = resolve(staticDirectory, 'index.html')
  }

  try {
    const content = await readFile(filePath)
    const contentTypes = {
      '.css': 'text/css; charset=utf-8',
      '.html': 'text/html; charset=utf-8',
      '.ico': 'image/x-icon',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.woff2': 'font/woff2',
    }
    response.writeHead(200, {
      'content-type': contentTypes[extname(filePath)] || 'application/octet-stream',
      'cache-control': filePath.includes(`${sep}assets${sep}`)
        ? 'public, max-age=31536000, immutable'
        : 'no-cache',
      'x-content-type-options': 'nosniff',
    })
    response.end(request.method === 'HEAD' ? undefined : content)
  } catch {
    sendJson(response, 503, { error: 'The frontend build is missing. Run npm run build first.' })
  }
}

const server = createServer(async (request, response) => {
  response.setHeader('access-control-allow-origin', allowedOrigin)
  response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS')
  response.setHeader('access-control-allow-headers', 'content-type')
  if (request.method === 'OPTIONS') {
    response.writeHead(204)
    response.end()
    return
  }

  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)

  try {
    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, { ok: true })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/products') {
      const catalog = await loadCatalog()
      const store = catalog[url.searchParams.get('store')]
      if (!store) {
        sendJson(response, 404, { error: 'Store not found.' })
        return
      }
      sendJson(response, 200, store)
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/orders') {
      const body = await readJson(request)
      const name = cleanText(body.name, 100)
      const email = cleanText(body.email, 254).toLowerCase()
      const storeId = cleanText(body.storeId, 80)
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        sendJson(response, 400, { error: 'Please enter your name and a valid email.' })
        return
      }
      if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
        sendJson(response, 400, { error: 'Your basket is empty or contains too many different items.' })
        return
      }

      const catalog = await loadCatalog()
      const store = catalog[storeId]
      if (!store) {
        sendJson(response, 400, { error: 'Store not found.' })
        return
      }

      const items = []
      for (const item of body.items) {
        const product = store.products.find((entry) => entry.id === item.productId)
        const variant = product?.variants.find((entry) => entry.id === item.variantId)
        const quantity = Number(item.quantity)
        if (!product || !variant || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
          sendJson(response, 400, { error: 'One or more basket items are invalid.' })
          return
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
        id: randomUUID(),
        storeId,
        storeName: store.brand,
        items,
        total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        currency: 'EUR',
        paymentStatus: 'not-configured-demo',
        receivedAt: new Date().toISOString(),
      }
      await saveRecord('orders.json', order)
      sendJson(response, 201, {
        ok: true,
        orderId: order.id,
        total: order.total,
        currency: order.currency,
        note: 'Demo order recorded; no payment was taken.',
      })
      return
    }

    if ((request.method === 'GET' || request.method === 'HEAD') && !url.pathname.startsWith('/api/')) {
      await serveStatic(url.pathname, request, response)
      return
    }

    sendJson(response, 404, { error: 'Endpoint not found.' })
  } catch (error) {
    const status = error.message === 'Request is too large.' ? 413 : 400
    sendJson(response, status, { error: error.message || 'Something went wrong.' })
  }
})

server.listen(port, () => {
  console.log(`Demo API listening on http://localhost:${port}`)
})
