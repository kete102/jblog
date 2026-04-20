import { Hono } from 'hono'
import React from 'react'
import { requireAuthor } from '@/middleware/auth'
import { getAuthorPosts } from '@/services/posts'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { PlusIcon } from '@/components/icons'

const router = new Hono()

/** Safely embed data as JSON for a client-side script tag */
function safeJson(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

// ─── GET /dashboard ───────────────────────────────────────────────────────────

router.get('/', requireAuthor, async (c) => {
  const user = c.get('user')!
  const posts = await getAuthorPosts(user.id)

  // Lean shape for client — strip heavy fields and serialise dates as ISO strings
  const dashboardData = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt ?? null,
    coverImageUrl: p.coverImageUrl ?? null,
    status: p.status,
    views: p.views,
    likes: p.likes,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
    tags: p.tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
  }))

  return c.render(
    <DashboardShell user={user} active="posts">
      <div className="p-4 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Publicaciones</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {posts.length} {posts.length === 1 ? 'publicación' : 'publicaciones'}
            </p>
          </div>
          <a
            href="/dashboard/post/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Nueva publicación
          </a>
        </div>

        {/* Dashboard client mounts here */}
        <script
          id="dashboard-data"
          type="application/json"
          dangerouslySetInnerHTML={{ __html: safeJson(dashboardData) }}
        />
        <div id="dashboard-root" />
      </div>
    </DashboardShell>,
    { seo: { title: 'Dashboard', noIndex: true }, clientBundle: 'dashboard' },
  )
})

export default router
