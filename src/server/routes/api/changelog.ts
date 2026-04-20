import { Hono } from 'hono'

// ─── GET /api/changelog ───────────────────────────────────────────────────────
// Returns the raw CHANGELOG.md content so the SPA can render it client-side
// with the `marked` library. Caches for 10 minutes in production.

const router = new Hono()

router.get('/', async (c) => {
  const markdown = await Bun.file('CHANGELOG.md').text()

  c.header('Cache-Control', 'public, max-age=600')
  return c.json({ markdown }, 200)
})

export default router
