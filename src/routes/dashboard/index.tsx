import { Hono } from 'hono'
import React from 'react'
import { requireAuthor } from '@/middleware/auth'
import { getAuthorPosts } from '@/services/posts'
import DashboardShell from '@/components/dashboard/DashboardShell'

const router = new Hono()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── GET /dashboard ───────────────────────────────────────────────────────────

router.get('/', requireAuthor, async (c) => {
  const user = c.get('user')!
  const posts = await getAuthorPosts(user.id)

  return c.render(
    <DashboardShell user={user} active="posts">
      <div className="p-4 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Posts</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </p>
          </div>
          <a
            href="/dashboard/post/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New post
          </a>
        </div>

        {/* Posts list */}
        {posts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-200 rounded-xl">
            <p className="text-zinc-500 text-sm">No posts yet.</p>
            <a
              href="/dashboard/post/new"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Write your first post →
            </a>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="border border-zinc-200 rounded-xl p-4 bg-white">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="font-medium text-zinc-900 leading-snug">{post.title}</div>
                    <span
                      className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                  {post.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-2">
                      {post.tags.map((tag) => (
                        <span key={tag.id} className="text-xs text-zinc-400">
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-zinc-400 mb-3">
                    {post.views.toLocaleString()} views · {post.likes.toLocaleString()} likes · {formatDate(post.updatedAt)}
                  </p>
                  <div className="flex items-center gap-1">
                    <a
                      href={`/dashboard/post/${post.id}/edit`}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                    >
                      Edit
                    </a>
                    <form method="POST" action={`/dashboard/post/${post.id}/publish`}>
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                      >
                        {post.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                    </form>
                    <form
                      method="POST"
                      action={`/dashboard/post/${post.id}/delete`}
                      onSubmit="return confirm('Delete this post? This cannot be undone.')"
                    >
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block border border-zinc-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 w-24">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 w-20">Views</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 w-20">Likes</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 w-32">Updated</th>
                    <th className="px-4 py-3 w-32" />
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post, i) => (
                    <tr
                      key={post.id}
                      className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors ${i % 2 === 0 ? '' : 'bg-zinc-50/50'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900 truncate max-w-xs">{post.title}</div>
                        {post.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {post.tags.map((tag) => (
                              <span key={tag.id} className="text-xs text-zinc-400">
                                #{tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            post.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{post.views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-zinc-500">{post.likes.toLocaleString()}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{formatDate(post.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`/dashboard/post/${post.id}/edit`}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                          >
                            Edit
                          </a>
                          <form method="POST" action={`/dashboard/post/${post.id}/publish`}>
                            <button
                              type="submit"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                            >
                              {post.status === 'published' ? 'Unpublish' : 'Publish'}
                            </button>
                          </form>
                          <form
                            method="POST"
                            action={`/dashboard/post/${post.id}/delete`}
                            onSubmit="return confirm('Delete this post? This cannot be undone.')"
                          >
                            <button
                              type="submit"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardShell>,
    { seo: { title: 'Dashboard', noIndex: true } },
  )
})

export default router
