import { Hono } from 'hono'
import React from 'react'
import { requireAuth } from '@/middleware/auth'
import { submitAuthorRequest, getAuthorRequest } from '@/services/users'
import DashboardShell from '@/components/dashboard/DashboardShell'

const router = new Hono()

router.use('*', requireAuth)

// ─── GET /dashboard/become-author ─────────────────────────────────────────────

router.get('/', async (c) => {
  const user = c.get('user')!

  // Only reader and rejected users can access this
  if (user.role !== 'reader' && user.role !== 'rejected') {
    return c.redirect('/dashboard')
  }

  const existing = await getAuthorRequest(user.id)

  return c.render(
    <DashboardShell user={user} active="profile">
      <div className="p-4 sm:p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-zinc-900 mb-1">Apply to become an author</h1>
          <p className="text-sm text-zinc-500">
            Tell us about yourself and what you'd like to write about. An admin will review your application.
          </p>
        </div>

        {user.role === 'rejected' && user.rejectedReason && (
          <div className="mb-6 px-4 py-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm font-medium text-amber-800 mb-0.5">Previous application feedback</p>
            <p className="text-sm text-amber-700">{user.rejectedReason}</p>
          </div>
        )}

        <form method="POST" action="/dashboard/become-author" className="space-y-6">
          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Short bio <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-zinc-500 mb-2">
              Introduce yourself — who you are, your background, and what drives your writing.
            </p>
            <textarea
              id="bio"
              name="bio"
              required
              minLength={20}
              maxLength={500}
              rows={4}
              defaultValue={existing?.bio ?? ''}
              placeholder="I'm a software engineer with 5 years of experience in distributed systems…"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Topics */}
          <div>
            <label htmlFor="topics" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Topics you want to write about <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-zinc-500 mb-2">
              What subjects, themes or areas would your posts cover?
            </p>
            <textarea
              id="topics"
              name="topics"
              required
              minLength={10}
              maxLength={300}
              rows={3}
              defaultValue={existing?.topics ?? ''}
              placeholder="Backend architecture, Rust, developer productivity tools…"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Sample writing — URL */}
          <div>
            <label htmlFor="sampleUrl" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Link to existing writing{' '}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <p className="text-xs text-zinc-500 mb-2">
              A blog post, Medium article, GitHub README — anything that shows your writing style.
            </p>
            <input
              id="sampleUrl"
              name="sampleUrl"
              type="url"
              defaultValue={existing?.sampleUrl ?? ''}
              placeholder="https://medium.com/…"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Sample writing — text */}
          <div>
            <label htmlFor="sampleText" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Or paste a writing sample{' '}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="sampleText"
              name="sampleText"
              maxLength={2000}
              rows={5}
              defaultValue={existing?.sampleText ?? ''}
              placeholder="Paste an excerpt or short article you've written…"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Submit application
            </button>
            <a
              href="/dashboard/profile"
              className="px-5 py-2.5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </DashboardShell>,
    { seo: { title: 'Become an author', noIndex: true } },
  )
})

// ─── POST /dashboard/become-author ────────────────────────────────────────────

router.post('/', async (c) => {
  const user = c.get('user')!

  if (user.role !== 'reader' && user.role !== 'rejected') {
    return c.redirect('/dashboard')
  }

  const body = await c.req.parseBody()
  const bio = String(body.bio ?? '').trim().slice(0, 500)
  const topics = String(body.topics ?? '').trim().slice(0, 300)
  const sampleUrl = String(body.sampleUrl ?? '').trim().slice(0, 500) || null
  const sampleText = String(body.sampleText ?? '').trim().slice(0, 2000) || null

  if (bio.length < 20 || topics.length < 10) {
    return c.redirect('/dashboard/become-author')
  }

  await submitAuthorRequest(user.id, { bio, topics, sampleUrl, sampleText })

  return c.redirect('/pending')
})

export default router
