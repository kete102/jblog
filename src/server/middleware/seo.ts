// ─── SEO bot middleware ───────────────────────────────────────────────────────
// When a known web crawler hits a non-API, non-asset route in production,
// this middleware intercepts the request and returns a minimal HTML page
// containing <title>, <meta name="description">, and Open Graph tags.
//
// Regular browsers always receive the full Vite-built SPA (index.html).
//
// Why: The SPA shell has no content for crawlers at request time. This gives
// search engines, link-preview scrapers, and social cards real metadata
// without introducing a full SSR setup.

import { createMiddleware } from 'hono/factory'
import { getPostBySlug, getTagBySlug, getAuthorById } from '@/services/posts'
import { config } from '@/config'

// ─── Bot UA patterns ──────────────────────────────────────────────────────────

const BOT_UA_RE =
  /bot|crawl|spider|slurp|mediapartners|adsbot|facebookexternalhit|whatsapp|twitterbot|linkedinbot|telegrambot|discordbot|slackbot|applebot|ia_archiver|semrush|ahrefs|mj12bot|dotbot/i

// ─── HTML template ────────────────────────────────────────────────────────────

interface MetaOpts {
  title: string
  description: string
  canonicalUrl: string
  image?: string | null
  type?: 'website' | 'article'
}

function buildMetaHtml({
  title,
  description,
  canonicalUrl,
  image,
  type = 'website',
}: MetaOpts): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  const t = esc(title)
  const d = esc(description)
  const u = esc(canonicalUrl)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${t}</title>
  <meta name="description" content="${d}" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:url" content="${u}" />
  <meta property="og:type" content="${type}" />${image ? `\n  <meta property="og:image" content="${esc(image)}" />` : ''}
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${u}" />
</head>
<body>
  <!-- Rendered for web crawlers. Human visitors receive the full SPA. -->
</body>
</html>`
}

// ─── Route-specific metadata resolvers ───────────────────────────────────────

const SITE_NAME = 'JBlog'

function siteTitle(page?: string) {
  return page ? `${page} | ${SITE_NAME}` : SITE_NAME
}

function absUrl(path: string) {
  return `${config.server.baseUrl}${path}`
}

// Matches /post/<slug>
const POST_RE = /^\/post\/([^/]+)\/?$/
// Matches /tag/<slug>
const TAG_RE = /^\/tag\/([^/]+)\/?$/
// Matches /author/<id>
const AUTHOR_RE = /^\/author\/([^/]+)\/?$/

async function resolveMetadata(pathname: string): Promise<MetaOpts> {
  // ── Home ──────────────────────────────────────────────────────────────────
  if (pathname === '/' || pathname === '') {
    return {
      title: SITE_NAME,
      description: 'Lee las últimas publicaciones del blog.',
      canonicalUrl: absUrl('/'),
    }
  }

  // ── Post ──────────────────────────────────────────────────────────────────
  const postMatch = POST_RE.exec(pathname)
  if (postMatch) {
    const slug = postMatch[1]
    try {
      const post = await getPostBySlug(slug)
      if (post) {
        return {
          title: siteTitle(post.title),
          description: post.excerpt ?? `Leer: ${post.title}`,
          canonicalUrl: absUrl(`/post/${slug}`),
          image: post.coverImageUrl,
          type: 'article',
        }
      }
    } catch {
      // fall through to default
    }
  }

  // ── Tag ───────────────────────────────────────────────────────────────────
  const tagMatch = TAG_RE.exec(pathname)
  if (tagMatch) {
    const slug = tagMatch[1]
    try {
      const tag = await getTagBySlug(slug)
      if (tag) {
        return {
          title: siteTitle(tag.name),
          description: `Publicaciones etiquetadas con "${tag.name}".`,
          canonicalUrl: absUrl(`/tag/${slug}`),
        }
      }
    } catch {
      // fall through to default
    }
  }

  // ── Author ────────────────────────────────────────────────────────────────
  const authorMatch = AUTHOR_RE.exec(pathname)
  if (authorMatch) {
    const id = authorMatch[1]
    try {
      const author = await getAuthorById(id)
      if (author) {
        return {
          title: siteTitle(author.name),
          description: author.bio ?? `Publicaciones de ${author.name}.`,
          canonicalUrl: absUrl(`/author/${id}`),
        }
      }
    } catch {
      // fall through to default
    }
  }

  // ── Changelog ─────────────────────────────────────────────────────────────
  if (pathname.startsWith('/changelog')) {
    return {
      title: siteTitle('Changelog'),
      description: 'Historial de cambios de JBlog.',
      canonicalUrl: absUrl('/changelog'),
    }
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return {
    title: SITE_NAME,
    description: 'Lee las últimas publicaciones del blog.',
    canonicalUrl: absUrl(pathname),
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export const seoMiddleware = createMiddleware(async (c, next) => {
  const ua = c.req.header('user-agent') ?? ''

  if (!BOT_UA_RE.test(ua)) {
    return next()
  }

  const { pathname } = new URL(c.req.url)

  // Skip API, auth, feed, sitemap — they have their own handlers
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/images/') ||
    pathname === '/sitemap.xml' ||
    pathname === '/feed.xml' ||
    pathname === '/favicon.svg'
  ) {
    return next()
  }

  const meta = await resolveMetadata(pathname)
  return c.html(buildMetaHtml(meta), 200)
})
