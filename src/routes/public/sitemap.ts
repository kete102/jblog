import { Hono } from 'hono'
import { db } from '@/db'
import { posts, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

const sitemapRouter = new Hono()

sitemapRouter.get('/sitemap.xml', async (c) => {
  const baseUrl = new URL(c.req.url).origin

  // Fetch all published posts (slug + publishedAt)
  const publishedPosts = await db
    .select({ slug: posts.slug, publishedAt: posts.publishedAt })
    .from(posts)
    .where(eq(posts.status, 'published'))
    .orderBy(posts.publishedAt)

  // Fetch all public authors
  const authors = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`${users.role} IN ('author', 'admin')`)

  function urlEntry(loc: string, lastmod?: Date | null, priority = 0.7) {
    const mod = lastmod ? `\n    <lastmod>${lastmod.toISOString().split('T')[0]}</lastmod>` : ''
    return `  <url>\n    <loc>${loc}</loc>${mod}\n    <priority>${priority}</priority>\n  </url>`
  }

  const entries = [
    urlEntry(`${baseUrl}/`, null, 1.0),
    ...publishedPosts.map((p) => urlEntry(`${baseUrl}/post/${p.slug}`, p.publishedAt, 0.8)),
    ...authors.map((a) => urlEntry(`${baseUrl}/author/${a.id}`, null, 0.6)),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`

  return c.text(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' })
})

export default sitemapRouter
