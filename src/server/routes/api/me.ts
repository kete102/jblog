import { Hono } from 'hono'

// ─── GET /api/me ──────────────────────────────────────────────────────────────
// Returns the currently authenticated user or 401.
// The SPA uses this on startup to determine auth state and role.

const router = new Hono()

router.get('/', (c) => {
  const user = c.get('user')
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  // Return a safe subset — never expose the raw DB row
  return c.json(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      socialLinks: user.socialLinks,
      role: user.role,
      rejectedReason: user.rejectedReason,
      publishedPostCount: user.publishedPostCount,
    },
    200,
  )
})

export default router
