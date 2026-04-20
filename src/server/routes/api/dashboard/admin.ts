import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getPendingUsers, approveUser, rejectUser, getUserById } from '@/services/users'
import { requireAdminApi } from '@/server/middleware/auth'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const rejectSchema = z.object({
  reason: z.string().max(500).optional(),
})

// ─── Router ───────────────────────────────────────────────────────────────────

const router = new Hono()

router.use('*', requireAdminApi)

// ─── GET /api/dashboard/admin/requests ────────────────────────────────────────
// Returns all users whose author request is pending review.

router.get('/requests', async (c) => {
  const pending = await getPendingUsers()

  return c.json(
    {
      requests: pending.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
        authorRequest: u.authorRequest
          ? {
              bio: u.authorRequest.bio,
              topics: u.authorRequest.topics,
              sampleUrl: u.authorRequest.sampleUrl,
              sampleText: u.authorRequest.sampleText,
            }
          : null,
      })),
    },
    200,
  )
})

// ─── POST /api/dashboard/admin/approve/:id ────────────────────────────────────
// Promotes a pending user to the author role.

router.post('/approve/:id', async (c) => {
  const id = c.req.param('id')
  const user = await getUserById(id)
  if (!user) return c.json({ error: 'User not found' }, 404)

  await approveUser(id)
  return c.json({ ok: true }, 200)
})

// ─── POST /api/dashboard/admin/reject/:id ─────────────────────────────────────
// Rejects a pending author request with an optional reason.

router.post('/reject/:id', zValidator('json', rejectSchema), async (c) => {
  const id = c.req.param('id')
  const { reason } = c.req.valid('json')

  const user = await getUserById(id)
  if (!user) return c.json({ error: 'User not found' }, 404)

  await rejectUser(id, reason)
  return c.json({ ok: true }, 200)
})

export default router
