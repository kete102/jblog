import type { Context, Next } from 'hono'

// ─── API-specific auth guards ─────────────────────────────────────────────────
// Unlike the browser-facing middleware in src/middleware/auth.ts, these return
// JSON error responses instead of redirects — appropriate for an API consumed
// by a SPA client.

/** Require any authenticated user — returns 401 JSON if unauthenticated */
export async function requireAuthApi(c: Context, next: Next) {
  const user = c.get('user')
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  await next()
}

/**
 * Require author or admin role.
 * Returns 401 if unauthenticated, 403 with a descriptive message otherwise.
 */
export async function requireAuthorApi(c: Context, next: Next) {
  const user = c.get('user')
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  if (user.role === 'reader') return c.json({ error: 'Forbidden: author role required' }, 403)
  if (user.role === 'pending') return c.json({ error: 'Forbidden: account pending approval' }, 403)
  if (user.role === 'rejected') return c.json({ error: 'Forbidden: author request was rejected' }, 403)
  await next()
}

/** Require admin role — returns 403 for any non-admin authenticated user */
export async function requireAdminApi(c: Context, next: Next) {
  const user = c.get('user')
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  if (user.role !== 'admin') return c.json({ error: 'Forbidden: admin role required' }, 403)
  await next()
}
