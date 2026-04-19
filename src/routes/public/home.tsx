import { Hono } from 'hono'
import React from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PostCard from '@/components/blog/PostCard'
import { ChevronLeftIcon, ChevronRightIcon, GoogleIcon } from '@/components/icons'
import { getPublishedPostsPaged, getPublishedPostsCount } from '@/services/posts'

const homeRouter = new Hono()

const PAGE_SIZE = 6

homeRouter.get('/', async (c) => {
  const user = c.get('user')
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1') || 1)

  const [posts, total] = await Promise.all([
    getPublishedPostsPaged(page, PAGE_SIZE),
    getPublishedPostsCount(),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasPrev = page > 1
  const hasNext = page < totalPages

  const [featured, ...rest] = posts

  return c.render(
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1">
        {/* ── Hero (page 1 only) ── */}
        {page === 1 && (
          <section className="border-b border-zinc-100 bg-linear-to-b from-indigo-50/60 to-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-6 animate-fade-in">
                ✦ Plataforma de escritura independiente
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 tracking-tight leading-[1.1] mb-5">
                <span className="block animate-fade-in-up" style={{ animationDelay: '0.1s' }}>Palabras que</span>
                <span className="text-indigo-600 animate-fade-in-up" style={{ animationDelay: '0.22s' }}>iluminan.</span>
              </h1>
              <p className="text-zinc-500 text-lg max-w-xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.32s' }}>
                Reflexiones de fe, esperanza y vida a la luz de la Palabra.
                Sin anuncios. Sin ruido. Solo buenas lecturas.
              </p>
            </div>
          </section>
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          {/* Page 2+ header */}
          {page > 1 && (
            <div className="flex items-center gap-3 mb-10">
              <a
                href="/"
                className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                ← Volver al inicio
              </a>
              <div className="flex-1 h-px bg-zinc-100" />
              <span className="text-xs text-zinc-400">Página {page} de {totalPages}</span>
            </div>
          )}

          {posts.length === 0 ? (
            <div className="text-center py-24 text-zinc-400">
              <p className="text-5xl mb-4">✍️</p>
              <p className="text-lg font-medium">Aún no hay publicaciones.</p>
              <p className="text-sm mt-1">¡Vuelve pronto!</p>
            </div>
          ) : (
            <>
              {/* ── Featured post (page 1 only) ── */}
              {page === 1 && featured && (
                <section className="mb-14 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">
                      Destacado
                    </span>
                    <div className="flex-1 h-px bg-zinc-100" />
                  </div>
                  <PostCard post={featured} featured />
                </section>
              )}

              {/* ── Posts grid ── */}
              {(page === 1 ? rest : posts).length > 0 && (
                <section>
                  {page === 1 && (
                    <div className="flex items-center gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                        Últimas
                      </span>
                      <div className="flex-1 h-px bg-zinc-100" />
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {(page === 1 ? rest : posts).map((post, i) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${0.25 + i * 0.07}s` }}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Pagination ── */}
              {(hasPrev || hasNext) && (
                <div className="flex items-center justify-between mt-12 pt-8 border-t border-zinc-100">
                  {hasPrev ? (
                    <a
                      href={`/?page=${page - 1}`}
                      className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-indigo-600 transition-colors"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                      Más recientes
                    </a>
                  ) : <span />}

                  <span className="text-xs text-zinc-400">
                    Página {page} de {totalPages}
                  </span>

                  {hasNext ? (
                    <a
                      href={`/?page=${page + 1}`}
                      className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-indigo-600 transition-colors"
                    >
                      Más antiguas
                      <ChevronRightIcon className="w-4 h-4" />
                    </a>
                  ) : <span />}
                </div>
              )}
            </>
          )}

          {/* ── Author CTA ── */}
          <section className="mt-16 sm:mt-20 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-700 to-zinc-900 px-8 py-12 sm:py-16 text-white">
              {/* Decorative warm blobs */}
              <div className="pointer-events-none absolute -top-10 -right-10 h-52 w-52 rounded-full bg-indigo-600/30" />
              <div className="pointer-events-none absolute -bottom-14 -left-8 h-64 w-64 rounded-full bg-zinc-700/40" />

              <div className="relative text-center">
                {!user ? (
                  <>
                    <p className="mb-4 text-xs font-bold uppercase tracking-widest text-indigo-200">
                      Para escritores
                    </p>
                    <h2 className="mb-3 text-2xl font-black sm:text-3xl">
                      Comparte tu fe con el mundo.
                    </h2>
                    <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-zinc-300">
                      Destellos de luz es una plataforma independiente para quienes
                      desean compartir reflexiones de fe. Sin algoritmos,
                      sin ruido — solo tus palabras.
                    </p>
                    <ul className="mx-auto mb-10 flex max-w-xs flex-col gap-2 text-sm text-zinc-300 text-left">
                      {['Experiencia de lectura hermosa', 'Plena propiedad de tu contenido', 'Conexión directa con los lectores'].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <a
                      href="/auth/google"
                      className="inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100"
                    >
                      <GoogleIcon className="w-4 h-4" />
                      Solicitar escribir
                    </a>
                  </>
                ) : user.role === 'pending' ? (
                  <>
                    <p className="mb-3 text-3xl">⏳</p>
                    <h2 className="mb-2 text-xl font-bold sm:text-2xl">
                      Tu solicitud está en revisión
                    </h2>
                    <p className="text-sm text-zinc-300">
                      Ya te tenemos en mente. Un administrador aprobará tu cuenta
                      en breve.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-3 text-3xl">✍️</p>
                    <h2 className="mb-4 text-xl font-bold sm:text-2xl">
                      ¿Listo para escribir?
                    </h2>
                    <a
                      href="/dashboard"
                      className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100"
                    >
                      Ir al panel
                    </a>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>,
    {
      seo: {
        title: page === 1 ? 'Destellos de luz — Palabras que iluminan' : `Destellos de luz — Página ${page}`,
        description: 'Reflexiones de fe, esperanza y vida a la luz de la Palabra.',
        noIndex: page > 1,
      },
    },
  )
})

export default homeRouter
