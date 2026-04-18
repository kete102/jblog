import type { Context, Next } from 'hono'
import { getSessionUser } from '@/lib/session'
import type { User } from '@/db/schema'

declare module 'hono' {
  interface ContextVariableMap {
    user: User | null
  }
}

/** Attach user to context on every request */
export async function userMiddleware(c: Context, next: Next) {
  const user = await getSessionUser(c)
  c.set('user', user)
  await next()
}

/** Require any authenticated user */
export async function requireAuth(c: Context, next: Next) {
  const user = c.get('user')
  if (!user) return c.redirect('/auth/google')
  await next()
}

/** Require author or admin role */
export async function requireAuthor(c: Context, next: Next) {
  const user = c.get('user')
  if (!user) return c.redirect('/auth/google')
  if (user.role === 'reader') return c.redirect('/dashboard/profile')
  if (user.role === 'pending') return c.redirect('/pending')
  if (user.role === 'rejected') return c.redirect('/dashboard/profile')
  await next()
}

/** Require admin role */
export async function requireAdmin(c: Context, next: Next) {
  const user = c.get('user')
  if (!user) return c.redirect('/auth/google')
  if (user.role !== 'admin') return c.notFound()
  await next()
}
