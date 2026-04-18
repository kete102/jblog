import { db } from '@/db'
import { sessions, users } from '@/db/schema'
import type { User } from '@/db/schema'
import { eq, lt } from 'drizzle-orm'
import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

const SESSION_COOKIE = 'jblog_session'
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

export async function createSession(userId: string): Promise<string> {
  const id = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await db.insert(sessions).values({ id, userId, expiresAt })

  return id
}

export async function getSessionUser(c: Context): Promise<User | null> {
  const sessionId = getCookie(c, SESSION_COOKIE)
  if (!sessionId) return null

  const result = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1)

  if (!result.length) return null

  const { session, user } = result[0]

  if (session.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
    deleteCookie(c, SESSION_COOKIE)
    return null
  }

  return user
}

export function setSessionCookie(c: Context, sessionId: string) {
  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DURATION_MS / 1000,
  })
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, SESSION_COOKIE)
}

export async function deleteSession(c: Context) {
  const sessionId = getCookie(c, SESSION_COOKIE)
  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
  }
  clearSessionCookie(c)
}

/** Purge expired sessions (run periodically) */
export async function purgeExpiredSessions() {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()))
}
