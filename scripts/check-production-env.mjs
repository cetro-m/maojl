import assert from 'node:assert/strict'

const requiredEnvironment = {
  NODE_ENV: process.env.NODE_ENV,
  NUXT_SITE_URL: process.env.NUXT_SITE_URL,
  NUXT_SITE_INDEXABLE: process.env.NUXT_SITE_INDEXABLE,
  NUXT_OG_IMAGE_SECRET: process.env.NUXT_OG_IMAGE_SECRET,
}

assert.equal(requiredEnvironment.NODE_ENV, 'production', 'NODE_ENV must be "production"')
assert.equal(
  requiredEnvironment.NUXT_SITE_INDEXABLE,
  'true',
  'NUXT_SITE_INDEXABLE must be "true" for a public production build',
)

const siteUrl = new URL(requiredEnvironment.NUXT_SITE_URL || '')
assert.equal(siteUrl.protocol, 'https:', 'NUXT_SITE_URL must use HTTPS')
assert.equal(siteUrl.pathname, '/', 'NUXT_SITE_URL must not include a path')
assert.equal(siteUrl.search, '', 'NUXT_SITE_URL must not include a query string')
assert.equal(siteUrl.hash, '', 'NUXT_SITE_URL must not include a fragment')

assert.match(
  requiredEnvironment.NUXT_OG_IMAGE_SECRET || '',
  /^[a-f0-9]{64}$/i,
  'NUXT_OG_IMAGE_SECRET must be a 64-character hexadecimal secret',
)

console.log(`Production environment is valid for ${siteUrl.origin}.`)
