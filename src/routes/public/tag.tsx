import { Hono } from 'hono'
import React from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PostCard from '@/components/blog/PostCard'
import { getTagBySlug, getPostsByTag } from '@/services/posts'

const tagRouter = new Hono()

tagRouter.get('/:slug', async (c) => {
  const user = c.get('user')
  const slug = c.req.param('slug')

  const [tag, posts] = await Promise.all([
    getTagBySlug(slug),
    getPostsByTag(slug),
  ])

  if (!tag) return c.notFound()

  return c.render(
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4 text-sm text-zinc-400">
              <a href="/" className="hover:text-zinc-600 transition-colors">Inicio</a>
              <span>/</span>
              <span className="text-zinc-500">Etiqueta</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
              #{tag.name}
            </h1>
            <p className="text-zinc-500 mt-2 text-sm">
              {posts.length} publicación{posts.length !== 1 ? 'es' : ''} con la etiqueta &ldquo;{tag.name}&rdquo;
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-16 text-zinc-400">
              <p className="text-lg font-medium">Aún no hay publicaciones.</p>
              <p className="text-sm mt-1">¡Vuelve pronto!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>,
    {
      seo: {
        title: `#${tag.name} — Destellos de luz`,
        description: `Todas las publicaciones con la etiqueta "${tag.name}" en Destellos de luz.`,
      },
    },
  )
})

export default tagRouter
