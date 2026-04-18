import { Hono } from 'hono'
import React from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PostCard from '@/components/blog/PostCard'
import AuthorBadge from '@/components/blog/AuthorBadge'
import { getAuthorById, getPostsByAuthor } from '@/services/posts'

const authorRouter = new Hono()

authorRouter.get('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const [author, authorPosts] = await Promise.all([
    getAuthorById(id),
    getPostsByAuthor(id),
  ])

  if (!author) {
    c.status(404)
    return c.render(
      <div className="min-h-screen flex flex-col">
        <Navbar user={user} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <p className="text-8xl font-black text-zinc-100 mb-4">404</p>
            <h1 className="text-2xl font-bold text-zinc-900 mb-3">Author not found</h1>
            <p className="text-zinc-500 mb-8">
              This author doesn't exist or is no longer active.
            </p>
            <a
              href="/"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Back to home
            </a>
          </div>
        </main>
        <Footer />
      </div>,
      { seo: { title: '404 — Author not found', noIndex: true } },
    )
  }

  const social = (author.socialLinks ?? {}) as {
    twitter?: string
    github?: string
    website?: string
  }

  const totalViews = authorPosts.reduce((sum, p) => sum + p.views, 0)
  const totalLikes = authorPosts.reduce((sum, p) => sum + p.likes, 0)

  function formatNumber(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
  }

  return c.render(
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1">
        {/* ── Profile header ── */}
        <section className="border-b border-zinc-100 bg-linear-to-b from-zinc-50 to-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 animate-fade-in-up">
              {/* Avatar */}
              {author.avatarUrl ? (
                <img
                  src={author.avatarUrl}
                  alt={author.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white shadow-md flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-3xl font-black shadow-md flex-shrink-0">
                  {author.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-1 flex items-center gap-2">
                  {author.name}
                  <AuthorBadge className="w-5 h-5" />
                </h1>

                {author.bio && (
                  <p className="text-zinc-500 text-sm leading-relaxed max-w-lg mb-4">
                    {author.bio}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-center sm:justify-start gap-5 text-sm text-zinc-500 mb-4">
                  <span>
                    <strong className="text-zinc-800 font-semibold">
                      {authorPosts.length}
                    </strong>{' '}
                    {authorPosts.length === 1 ? 'post' : 'posts'}
                  </span>
                  <span>
                    <strong className="text-zinc-800 font-semibold">
                      {formatNumber(totalViews)}
                    </strong>{' '}
                    views
                  </span>
                  <span>
                    <strong className="text-zinc-800 font-semibold">
                      {formatNumber(totalLikes)}
                    </strong>{' '}
                    likes
                  </span>
                </div>

                {/* Social links */}
                {(social.twitter || social.github || social.website) && (
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    {social.github && (
                      <a
                        href={social.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub"
                        className="text-zinc-400 hover:text-zinc-700 transition-colors"
                      >
                        {/* GitHub icon */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
                        </svg>
                      </a>
                    )}
                    {social.twitter && (
                      <a
                        href={social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Twitter / X"
                        className="text-zinc-400 hover:text-zinc-700 transition-colors"
                      >
                        {/* X / Twitter icon */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    )}
                    {social.website && (
                      <a
                        href={social.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Personal website"
                        className="text-zinc-400 hover:text-zinc-700 transition-colors"
                      >
                        {/* Globe icon */}
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Posts ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          {authorPosts.length === 0 ? (
            <div className="text-center py-16 text-zinc-400">
              <p className="text-4xl mb-4">✍️</p>
              <p className="text-lg font-medium">No posts yet.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  All posts
                </span>
                <div className="flex-1 h-px bg-zinc-100" />
                <span className="text-xs text-zinc-400">{authorPosts.length}</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {authorPosts.map((post, i) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${0.15 + i * 0.07}s` }}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>,
    {
      seo: {
        title: `${author.name} — jblog`,
        description: author.bio ?? `Posts by ${author.name} on jblog.`,
      },
    },
  )
})

export default authorRouter
