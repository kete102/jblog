import { Hono } from 'hono'
import { Google, generateCodeVerifier, generateState } from 'arctic'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createSession, setSessionCookie, deleteSession } from '@/lib/session'

const authRouter = new Hono()

function getGoogle() {
  return new Google(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.BASE_URL}/auth/google/callback`,
  )
}

// GET /auth/google — redirect to Google
authRouter.get('/google', async (c) => {
  const google = getGoogle()
  const state = generateState()
  const codeVerifier = generateCodeVerifier()

  const url = google.createAuthorizationURL(state, codeVerifier, [
    'openid',
    'email',
    'profile',
  ])

  setCookie(c, 'google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
    sameSite: 'Lax',
  })

  setCookie(c, 'google_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
    sameSite: 'Lax',
  })

  return c.redirect(url.toString())
})

// GET /auth/google/callback — handle OAuth callback
authRouter.get('/google/callback', async (c) => {
  const google = getGoogle()
  const { code, state } = c.req.query()
  const storedState = getCookie(c, 'google_oauth_state')
  const codeVerifier = getCookie(c, 'google_code_verifier')

  deleteCookie(c, 'google_oauth_state')
  deleteCookie(c, 'google_code_verifier')

  if (!code || !state || state !== storedState || !codeVerifier) {
    return c.text('Invalid OAuth state', 400)
  }

  let tokens
  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier)
  } catch {
    return c.text('Failed to validate authorization code', 400)
  }

  // Fetch Google profile
  const idToken = tokens.idToken()
  const payload = decodeJwtPayload(idToken)

  if (!payload?.email || !payload?.sub) {
    return c.text('Failed to get user info from Google', 400)
  }

  const googleId = payload.sub as string
  const email = payload.email as string
  const name = (payload.name as string) || email.split('@')[0]
  const avatarUrl = (payload.picture as string) || null

  // Find or create user
  let user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((r) => r[0] ?? null)

  if (!user) {
    const isAdmin = email === process.env.ADMIN_EMAIL
    const id = googleId

    await db.insert(users).values({
      id,
      name,
      email,
      avatarUrl,
      role: isAdmin ? 'admin' : 'pending',
    })

    user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
      .then((r) => r[0])
  } else {
    // Promote to admin if email matches and not already admin
    if (email === process.env.ADMIN_EMAIL && user.role !== 'admin') {
      await db
        .update(users)
        .set({ role: 'admin', updatedAt: new Date() })
        .where(eq(users.id, user.id))
      user.role = 'admin'
    }
    // Update avatar if changed
    if (avatarUrl && avatarUrl !== user.avatarUrl) {
      await db
        .update(users)
        .set({ avatarUrl, updatedAt: new Date() })
        .where(eq(users.id, user.id))
    }
  }

  const sessionId = await createSession(user.id)
  setSessionCookie(c, sessionId)

  if (user.role === 'pending') {
    return c.redirect('/pending')
  }

  return c.redirect('/dashboard')
})

// POST /auth/logout
authRouter.post('/logout', async (c) => {
  await deleteSession(c)
  return c.redirect('/')
})

// Minimal JWT payload decoder (no verification needed — data comes from Google's own callback)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export default authRouter
