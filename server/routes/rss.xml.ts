import { queryCollection } from '@nuxt/content/server'

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export default defineEventHandler(async (event) => {
  const siteUrl = (process.env.NUXT_SITE_URL || 'https://maojl.xyz').replace(/\/$/, '')

  const [posts, notes] = await Promise.all([
    queryCollection(event, 'blog')
      .select('path', 'title', 'description', 'date')
      .where('draft', '=', false)
      .order('date', 'DESC')
      .all(),
    queryCollection(event, 'notes')
      .select('path', 'title', 'description', 'date')
      .where('draft', '=', false)
      .order('date', 'DESC')
      .all(),
  ])

  const entries = [...posts, ...notes]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30)
    .map((entry) => {
      const url = `${siteUrl}${entry.path}`
      return `<item><title>${escapeXml(entry.title)}</title><link>${escapeXml(url)}</link><guid>${escapeXml(url)}</guid><pubDate>${new Date(`${entry.date}T00:00:00Z`).toUTCString()}</pubDate><description>${escapeXml(entry.description)}</description></item>`
    })
    .join('')

  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>MAOJL.XYZ</title><link>${escapeXml(siteUrl)}</link><description>Code, games, tools, media, and notes from everyday side quests.</description>${entries}</channel></rss>`
})
