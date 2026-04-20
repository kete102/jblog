import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { submitAuthorRequest, getAuthorRequest } from '@/services/users'
import { requireAuthApi } from '@/server/middleware/auth'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const authorRequestSchema = z.object({
  bio: z.string().min(20, 'Bio must be at least 20 characters').max(500),
  topics: z.string().min(10, 'Topics must be at least 10 characters').max(300),
  sampleUrl: z.string().url().nullable().optional(),
  sampleText: z.string().max(2000).nullable().optional(),
})

// ─── Router ───────────────────────────────────────────────────────────────────

const router = new Hono()

router.use('*', requireAuthApi)

// ─── GET /api/dashboard/become-author ────────────────────────────────────────
// Returns the user's existing author request (if any) to pre-fill the form.

router.get('/', async (c) => {
  const user = c.get('user')!

  // Only reader and rejected users should see this
  if (user.role !== 'reader' && user.role !== 'rejected') {
    return c.json({ error: 'Forbidden: you already have author access' }, 403)
  }

  const existing = await getAuthorRequest(user.id)

  return c.json(
    {
      authorRequest: existing
        ? {
            bio: existing.bio,
            topics: existing.topics,
            sampleUrl: existing.sampleUrl,
            sampleText: existing.sampleText,
          }
        : null,
      rejectedReason: user.role === 'rejected' ? user.rejectedReason : null,
    },
    200,
  )
})

// ─── POST /api/dashboard/become-author ───────────────────────────────────────
// Submits (or updates) an author request and sets the user's role to pending.

router.post('/', zValidator('json', authorRequestSchema), async (c) => {
  const user = c.get('user')!

  if (user.role !== 'reader' && user.role !== 'rejected') {
    return c.json({ error: 'Forbidden: you already have author access' }, 403)
  }

  const body = c.req.valid('json')

  await submitAuthorRequest(user.id, {
    bio: body.bio,
    topics: body.topics,
    sampleUrl: body.sampleUrl ?? null,
    sampleText: body.sampleText ?? null,
  })

  return c.json({ ok: true }, 201)
})

export default router
