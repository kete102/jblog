import { Hono } from 'hono'
import { getTagsWithPostCount } from '@/services/posts'

// ─── /api/tags ────────────────────────────────────────────────────────────────

const router = new Hono()

// GET /api/tags — list all tags with their published post count
router.get('/', async (c) => {
  const tags = await getTagsWithPostCount()
  return c.json({ tags })
})

export default router
