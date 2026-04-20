import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { requireAdminApi, requireAuthApi, requireAuthorApi } from './auth'
import type { User } from '@/db/schema'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeUser(role: User['role']): User {
  return {
    id: 'test-id',
    email: `${role}@test.com`,
    name: role,
    avatarUrl: null,
    bio: null,
    socialLinks: null,
    role,
    rejectedReason: null,
    publishedPostCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

type Guard = (c: Parameters<Parameters<Hono['get']>[1]>[0], next: () => Promise<void>) => Promise<Response | void>

/** Create a minimal Hono app that injects a user then runs the guard. */
function makeApp(guard: Guard, user: User | null) {
  const app = new Hono()
  // Inject user into context before the guard runs
  app.use('*', (c, next) => {
    c.set('user' as never, user as never)
    return next()
  })
  app.get('/test', guard as never, (c) => c.json({ ok: true }))
  return app
}

// ─── requireAuthApi ───────────────────────────────────────────────────────────

describe('requireAuthApi', () => {
  it('passes through for any authenticated user', async () => {
    for (const role of ['reader', 'author', 'admin', 'pending', 'rejected'] as const) {
      const res = await makeApp(requireAuthApi, makeUser(role)).request('/test')
      expect(res.status).toBe(200)
    }
  })

  it('returns 401 when unauthenticated', async () => {
    const res = await makeApp(requireAuthApi, null).request('/test')
    expect(res.status).toBe(401)
    expect((await res.json<{ error: string }>()).error).toBe('Unauthorized')
  })
})

// ─── requireAuthorApi ─────────────────────────────────────────────────────────

describe('requireAuthorApi', () => {
  it('passes through for author role', async () => {
    const res = await makeApp(requireAuthorApi, makeUser('author')).request('/test')
    expect(res.status).toBe(200)
  })

  it('passes through for admin role', async () => {
    const res = await makeApp(requireAuthorApi, makeUser('admin')).request('/test')
    expect(res.status).toBe(200)
  })

  it('returns 401 when unauthenticated', async () => {
    const res = await makeApp(requireAuthorApi, null).request('/test')
    expect(res.status).toBe(401)
  })

  it('returns 403 for reader role', async () => {
    const res = await makeApp(requireAuthorApi, makeUser('reader')).request('/test')
    expect(res.status).toBe(403)
    const body = await res.json<{ error: string }>()
    expect(body.error).toContain('author role required')
  })

  it('returns 403 for pending role', async () => {
    const res = await makeApp(requireAuthorApi, makeUser('pending')).request('/test')
    expect(res.status).toBe(403)
    const body = await res.json<{ error: string }>()
    expect(body.error).toContain('pending approval')
  })

  it('returns 403 for rejected role', async () => {
    const res = await makeApp(requireAuthorApi, makeUser('rejected')).request('/test')
    expect(res.status).toBe(403)
    const body = await res.json<{ error: string }>()
    expect(body.error).toContain('rejected')
  })
})

// ─── requireAdminApi ──────────────────────────────────────────────────────────

describe('requireAdminApi', () => {
  it('passes through for admin role', async () => {
    const res = await makeApp(requireAdminApi, makeUser('admin')).request('/test')
    expect(res.status).toBe(200)
  })

  it('returns 401 when unauthenticated', async () => {
    const res = await makeApp(requireAdminApi, null).request('/test')
    expect(res.status).toBe(401)
  })

  it('returns 403 for reader role', async () => {
    const res = await makeApp(requireAdminApi, makeUser('reader')).request('/test')
    expect(res.status).toBe(403)
    const body = await res.json<{ error: string }>()
    expect(body.error).toContain('admin role required')
  })

  it('returns 403 for author role', async () => {
    const res = await makeApp(requireAdminApi, makeUser('author')).request('/test')
    expect(res.status).toBe(403)
  })

  it('returns 403 for pending role', async () => {
    const res = await makeApp(requireAdminApi, makeUser('pending')).request('/test')
    expect(res.status).toBe(403)
  })

  it('returns 403 for rejected role', async () => {
    const res = await makeApp(requireAdminApi, makeUser('rejected')).request('/test')
    expect(res.status).toBe(403)
  })
})
