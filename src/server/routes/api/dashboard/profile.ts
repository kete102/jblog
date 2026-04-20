import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { updateUserProfile, deleteUser } from '@/services/users'
import { deleteSession } from '@/lib/session'
import { requireAuthApi } from '@/server/middleware/auth'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  socialLinks: z
    .object({
      twitter: z.string().url().optional().or(z.literal('')),
      github: z.string().url().optional().or(z.literal('')),
      website: z.string().url().optional().or(z.literal('')),
    })
    .optional(),
})

// ─── Router ───────────────────────────────────────────────────────────────────

const router = new Hono()

router.use('*', requireAuthApi)

// ─── GET /api/dashboard/profile ───────────────────────────────────────────────
// Returns the authenticated user's own profile.

router.get('/', (c) => {
  const user = c.get('user')!

  return c.json(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      socialLinks: user.socialLinks ?? {},
      role: user.role,
      rejectedReason: user.rejectedReason,
      publishedPostCount: user.publishedPostCount,
    },
    200,
  )
})

// ─── PUT /api/dashboard/profile ───────────────────────────────────────────────
// Updates the authenticated user's profile fields.

router.put('/', zValidator('json', updateProfileSchema), async (c) => {
  const user = c.get('user')!
  const body = c.req.valid('json')

  await updateUserProfile(user.id, {
    name: body.name.trim(),
    bio: body.bio?.trim() || null,
    avatarUrl: body.avatarUrl?.trim() || null,
    socialLinks: {
      twitter: body.socialLinks?.twitter?.trim() || undefined,
      github: body.socialLinks?.github?.trim() || undefined,
      website: body.socialLinks?.website?.trim() || undefined,
    },
  })

  return c.json({ ok: true }, 200)
})

// ─── DELETE /api/dashboard/profile ────────────────────────────────────────────
// Permanently deletes the authenticated user's account and all associated data.

router.delete('/', async (c) => {
  const user = c.get('user')!

  await deleteSession(c)
  await deleteUser(user.id)

  return c.json({ ok: true }, 200)
})

export default router
