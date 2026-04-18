import { Hono } from 'hono'
import { Google, generateCodeVerifier, generateState, decodeIdToken } from 'arctic'
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

  // Clean up PKCE cookies regardless of outcome
  deleteCookie(c, 'google_oauth_state', { path: '/' })
  deleteCookie(c, 'google_code_verifier', { path: '/' })

  if (!code || !state || state !== storedState || !codeVerifier) {
    return c.text('Invalid OAuth state — please try signing in again.', 400)
  }

  let tokens
  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier)
  } catch (e) {
    console.error('OAuth token exchange failed:', e)
    return c.text('Failed to validate authorization code', 400)
  }

  // Decode the ID token using arctic's built-in decoder
  let claims: Record<string, unknown>
  try {
    claims = decodeIdToken(tokens.idToken()) as Record<string, unknown>
  } catch (e) {
    console.error('Failed to decode ID token:', e)
    return c.text('Failed to decode ID token', 400)
  }

  const googleId = claims.sub as string | undefined
  const email = claims.email as string | undefined

  if (!googleId || !email) {
    return c.text('Missing required fields in ID token', 400)
  }

  const name = (claims.name as string) || email.split('@')[0]
  const avatarUrl = (claims.picture as string) || null

  // Find or create user
  let user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((r) => r[0] ?? null)

  if (!user) {
    const isAdmin = email === process.env.ADMIN_EMAIL

    await db.insert(users).values({
      id: googleId,
      name,
      email,
      avatarUrl,
      role: isAdmin ? 'admin' : 'reader',
    })

    user = await db
      .select()
      .from(users)
      .where(eq(users.id, googleId))
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

  if (user.role === 'reader' || user.role === 'pending') {
    return c.redirect('/dashboard/profile')
  }

  if (user.role === 'rejected') {
    return c.redirect('/dashboard/profile')
  }

  return c.redirect('/dashboard')
})

// POST /auth/logout
authRouter.post('/logout', async (c) => {
  await deleteSession(c)
  return c.redirect('/')
})

export default authRouter
