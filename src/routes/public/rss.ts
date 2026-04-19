import { Hono } from 'hono'
import { getPublishedPostsPaged } from '@/services/posts'
import { config } from '@/config'

const rssRouter = new Hono()

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

rssRouter.get('/feed.xml', async (c) => {
  const baseUrl = config.server.baseUrl.replace(/\/$/, '')
  const posts = await getPublishedPostsPaged(1, 20)

  const items = posts.map((post) => {
    const url = `${baseUrl}/post/${post.slug}`
    const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : ''
    return [
      '    <item>',
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      post.excerpt ? `      <description>${escapeXml(post.excerpt)}</description>` : '',
      `      <author>${escapeXml(post.author.name)}</author>`,
      pubDate ? `      <pubDate>${pubDate}</pubDate>` : '',
      '    </item>',
    ].filter(Boolean).join('\n')
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>jblog</title>
    <link>${baseUrl}</link>
    <description>Thoughtful writing on technology, design, and everything in between.</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return c.body(xml, 200, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  })
})

export default rssRouter
