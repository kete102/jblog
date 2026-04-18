import { Hono } from 'hono'
import React from 'react'
import { requireAuth } from '@/middleware/auth'
import { updateUserProfile, deleteUser, requestAgain } from '@/services/users'
import { deleteSession } from '@/lib/session'
import DashboardShell from '@/components/dashboard/DashboardShell'

const router = new Hono()

router.use('*', requireAuth)

// ─── GET /dashboard/profile ───────────────────────────────────────────────────

router.get('/', (c) => {
  const user = c.get('user')!
  const saved = c.req.query('saved') === '1'

  return c.render(
    <DashboardShell user={user} active="profile">
      <div className="p-4 sm:p-8 max-w-xl">
        <h1 className="text-xl font-semibold text-zinc-900 mb-6">Profile</h1>

        {/* Author request status banner */}
        {user.role === 'pending' && (
          <div className="mb-6 px-4 py-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm font-medium text-amber-800 mb-0.5">Author request pending</p>
            <p className="text-sm text-amber-700">
              Your request to become an author is under review. You'll get access to the dashboard once approved.
            </p>
          </div>
        )}

        {user.role === 'rejected' && (
          <div className="mb-6 px-4 py-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm font-medium text-red-800 mb-1">Author request not approved</p>
            {user.rejectedReason ? (
              <p className="text-sm text-red-700 mb-3">{user.rejectedReason}</p>
            ) : (
              <p className="text-sm text-red-700 mb-3">
                Your request to become an author was not approved at this time.
              </p>
            )}
            <p className="text-sm text-red-600 mb-4">
              Questions? Reach out at{' '}
              <a href="mailto:kete102@gmail.com" className="underline underline-offset-2 hover:text-red-800">
                kete102@gmail.com
              </a>
            </p>
            <form method="POST" action="/dashboard/profile/request-again">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Submit a new request
              </button>
            </form>
          </div>
        )}

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

        {/* Danger zone */}
        <div className="mt-12 pt-8 border-t border-zinc-200">
          <h2 className="text-sm font-medium text-zinc-900 mb-1">Danger zone</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Permanently delete your account and all of your posts. This cannot be undone.
          </p>
          <a
            href="/dashboard/profile/delete"
            className="inline-flex items-center px-4 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete account
          </a>
        </div>
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

// ─── POST /dashboard/profile/request-again ───────────────────────────────────

router.post('/request-again', async (c) => {
  const user = c.get('user')!
  if (user.role !== 'rejected') return c.redirect('/dashboard/profile')

  await requestAgain(user.id)
  return c.redirect('/pending')
})

// ─── GET /dashboard/profile/delete ───────────────────────────────────────────

router.get('/delete', (c) => {
  const user = c.get('user')!

  return c.render(
    <DashboardShell user={user} active="profile">
      <div className="p-4 sm:p-8 max-w-md">
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">Delete account</h1>
        <p className="text-sm text-zinc-500 mb-8">
          This will permanently delete your account, all your posts, and all associated data.
          This action cannot be undone.
        </p>

        <div className="rounded-lg border border-red-200 bg-red-50 p-5 space-y-4">
          <p className="text-sm font-medium text-red-700">
            You are about to delete <span className="font-semibold">{user.name}</span>'s account.
          </p>

          <div className="flex items-center gap-3">
            <form method="POST" action="/dashboard/profile/delete">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Yes, delete my account
              </button>
            </form>
            <a
              href="/dashboard/profile"
              className="px-4 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </a>
          </div>
        </div>
      </div>
    </DashboardShell>,
    { seo: { title: 'Delete account', noIndex: true } },
  )
})

// ─── POST /dashboard/profile/delete ──────────────────────────────────────────

router.post('/delete', async (c) => {
  const user = c.get('user')!

  await deleteSession(c)
  await deleteUser(user.id)

  return c.redirect('/')
})

export default router
