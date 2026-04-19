import { Hono } from 'hono'
import React from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PostCard from '@/components/blog/PostCard'
import AuthorBadge from '@/components/blog/AuthorBadge'
import { GithubIcon, TwitterIcon, GlobeIcon } from '@/components/icons'
import { formatNumber } from '@/lib/format'
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
            <h1 className="text-2xl font-bold text-zinc-900 mb-3">Autor no encontrado</h1>
            <p className="text-zinc-500 mb-8">
              Este autor no existe o ya no está activo.
            </p>
              <a
              href="/"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Volver al inicio
            </a>
          </div>
        </main>
        <Footer />
      </div>,
      { seo: { title: '404 — Autor no encontrado', noIndex: true } },
    )
  }

  const social = (author.socialLinks ?? {}) as {
    twitter?: string
    github?: string
    website?: string
  }

  const totalViews = authorPosts.reduce((sum, p) => sum + p.views, 0)
  const totalLikes = authorPosts.reduce((sum, p) => sum + p.likes, 0)

  return c.render(
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1">
        {/* ── Profile header ── */}
        <section className="border-b border-zinc-100 bg-linear-to-b from-zinc-50 to-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 animate-fade-in-up">
              {/* Avatar — unique responsive size, kept inline */}
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
                    {authorPosts.length === 1 ? 'publicación' : 'publicaciones'}
                  </span>
                  <span>
                    <strong className="text-zinc-800 font-semibold">
                      {formatNumber(totalViews)}
                    </strong>{' '}
                    vistas
                  </span>
                  <span>
                    <strong className="text-zinc-800 font-semibold">
                      {formatNumber(totalLikes)}
                    </strong>{' '}
                    me gusta
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
                        <GithubIcon className="w-5 h-5" />
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
                        <TwitterIcon className="w-5 h-5" />
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
                        <GlobeIcon className="w-5 h-5" />
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
              <p className="text-lg font-medium">Aún no hay publicaciones.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Todas las publicaciones
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
        title: `${author.name} — Destellos de luz`,
        description: author.bio ?? `Publicaciones de ${author.name} en Destellos de luz.`,
      },
    },
  )
})

export default authorRouter
