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
