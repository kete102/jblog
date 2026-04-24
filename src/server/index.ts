import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'
import { userMiddleware } from '@/middleware/auth'
import authRouter from '@/routes/auth/google'
import rssRouter from '@/routes/public/rss'
import sitemapRouter from '@/routes/public/sitemap'
import apiRouter from '@/server/routes/api'
import { seoMiddleware } from '@/server/middleware/seo'
import { config } from '@/config'

const app = new Hono()

// ─── Static assets ────────────────────────────────────────────────────────────
// Serve favicon and user-uploaded images. In production the full dist/ output
// is served further down; these rules take priority for the specified paths.

app.use('/favicon.svg', serveStatic({ path: './public/favicon.svg' }))
app.use('/images/*', serveStatic({ root: './public' }))

// ─── Dev-only CORS ────────────────────────────────────────────────────────────
// In development Vite runs on port 5173 while Hono runs on 3000.
// This allows the SPA dev server to call the API without CORS errors.
// In production Hono serves the built SPA directly — no CORS needed.

if (!config.server.isProduction) {
  app.use(
    '/api/*',
    cors({
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    }),
  )
}

// ─── Attach user to every request ────────────────────────────────────────────

app.use('*', userMiddleware)

// ─── Auth routes (browser-facing; must stay non-API) ─────────────────────────
// Google OAuth flow uses browser redirects and cookies — it cannot be a pure
// JSON endpoint. Logout similarly redirects the browser.

app.route('/auth', authRouter)

// ─── Feed & sitemap (unchanged) ───────────────────────────────────────────────

app.route('/', sitemapRouter)
app.route('/', rssRouter)

// ─── API ─────────────────────────────────────────────────────────────────────

app.route('/api', apiRouter)

// ─── Production: serve the Vite-built SPA for all remaining routes ────────────
// Hono will handle any /api/* miss with a 404 before reaching this fallback.
// Static assets (JS, CSS, images) are served by the first serveStatic call;
// any non-matched path returns index.html so client-side routing works.
// Bot detection runs first: crawlers get a lightweight metadata-only HTML page
// instead of the blank SPA shell, giving search engines real content to index.

if (config.server.isProduction) {
  app.use('*', seoMiddleware)
  app.use('*', serveStatic({ root: './dist' }))
  app.get('*', serveStatic({ path: './dist/index.html' }))
} else {
  // In dev, Vite owns the SPA at port 5173. Redirect any unmatched path so
  // that reloading a client-side route on port 3000 works as expected.
  app.get('*', (c) => {
    const { pathname, search } = new URL(c.req.url)
    return c.redirect(`http://localhost:5173${pathname}${search}`, 302)
  })
}

// ─── Type export for Hono RPC ─────────────────────────────────────────────────

export type AppType = typeof app
export default app
