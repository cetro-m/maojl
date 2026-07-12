import assert from 'node:assert/strict'

const baseUrl = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3010').replace(/\/$/, '')
const routes = [
  '/',
  '/about',
  '/blog',
  '/blog/linux-common-commands',
  '/blog/nginx-config-guide',
  '/notes',
  '/notes/site-roadmap-next-phase',
  '/releases',
  '/releases/company-site-v1',
  '/archive',
  '/search',
  '/robots.txt',
  '/sitemap.xml',
  '/rss.xml',
]

for (const route of routes) {
  const response = await fetch(`${baseUrl}${route}`)
  assert.equal(response.status, 200, `${route} returned ${response.status}`)

  const body = await response.text()
  const minimumLength = route === '/robots.txt' ? 20 : 100
  assert.ok(body.length > minimumLength, `${route} returned an unexpectedly small body`)
}

const assets = [
  '/fonts/vt323-latin-400-normal.woff2',
  '/fonts/zpix.woff2',
  '/images/about-pixel-art.jpg',
]

for (const asset of assets) {
  const response = await fetch(`${baseUrl}${asset}`)
  assert.equal(response.status, 200, `${asset} returned ${response.status}`)

  const body = await response.arrayBuffer()
  assert.ok(body.byteLength > 1_000, `${asset} returned an unexpectedly small file`)
}

const missing = await fetch(`${baseUrl}/this-route-should-not-exist`)
assert.equal(missing.status, 404, `missing route returned ${missing.status}`)

console.log(`Smoke test passed for ${routes.length} public routes, ${assets.length} assets, and the 404 boundary.`)
