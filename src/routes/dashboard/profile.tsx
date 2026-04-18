import { Hono } from 'hono'
import React from 'react'
import { requireAuthor } from '@/middleware/auth'
import { updateUserProfile } from '@/services/users'
import DashboardShell from '@/components/dashboard/DashboardShell'

const router = new Hono()

router.use('*', requireAuthor)

// ─── GET /dashboard/profile ───────────────────────────────────────────────────

router.get('/', (c) => {
  const user = c.get('user')!
  const saved = c.req.query('saved') === '1'

  return c.render(
    <DashboardShell user={user} active="profile">
      <div className="p-8 max-w-xl">
        <h1 className="text-xl font-semibold text-zinc-900 mb-6">Profile</h1>

        {saved && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">
            Profile saved.
          </div>
        )}

        <form method="POST" action="/dashboard/profile" className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Display name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={user.name}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={user.bio ?? ''}
              placeholder="A short bio shown on your author page…"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Avatar URL
            </label>
            <input
              id="avatarUrl"
              name="avatarUrl"
              type="url"
              defaultValue={user.avatarUrl ?? ''}
              placeholder="https://…"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Social links */}
          <div>
            <p className="text-sm font-medium text-zinc-700 mb-3">Social links</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs text-zinc-500 shrink-0">Twitter</span>
                <input
                  name="twitter"
                  type="url"
                  defaultValue={user.socialLinks?.twitter ?? ''}
                  placeholder="https://twitter.com/…"
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs text-zinc-500 shrink-0">GitHub</span>
                <input
                  name="github"
                  type="url"
                  defaultValue={user.socialLinks?.github ?? ''}
                  placeholder="https://github.com/…"
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs text-zinc-500 shrink-0">Website</span>
                <input
                  name="website"
                  type="url"
                  defaultValue={user.socialLinks?.website ?? ''}
                  placeholder="https://…"
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Save profile
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>,
    { seo: { title: 'Profile', noIndex: true } },
  )
})

// ─── POST /dashboard/profile ──────────────────────────────────────────────────

router.post('/', async (c) => {
  const user = c.get('user')!
  const body = await c.req.parseBody()

  const name = String(body.name ?? '').trim()
  if (!name) return c.redirect('/dashboard/profile')

  await updateUserProfile(user.id, {
    name,
    bio: String(body.bio ?? '').trim() || null,
    avatarUrl: String(body.avatarUrl ?? '').trim() || null,
    socialLinks: {
      twitter: String(body.twitter ?? '').trim() || undefined,
      github: String(body.github ?? '').trim() || undefined,
      website: String(body.website ?? '').trim() || undefined,
    },
  })

  return c.redirect('/dashboard/profile?saved=1')
})

export default router
