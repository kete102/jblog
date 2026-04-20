import React from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PostCard } from '../../components/PostCard'
import { TagBadge } from '../../components/TagBadge'
import { tagPostsOptions } from '../../lib/api'
import { usePageTitle } from '../../lib/usePageTitle'

// ─── Tag page — posts filtered by tag ─────────────────────────────────────────

export const Route = createFileRoute('/tag/$slug')({
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.ensureQueryData(tagPostsOptions(params.slug))
    } catch {
      throw notFound()
    }
  },
  component: TagPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center text-zinc-500">
      Etiqueta no encontrada.
    </div>
  ),
})

function TagPage() {
  const { slug } = Route.useParams()
  const { data, isLoading, isError } = useQuery(tagPostsOptions(slug))
  usePageTitle(data?.tag.name)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Cargando etiqueta…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-sm">No se pudo cargar la etiqueta.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <TagBadge tag={data.tag} />
        <span className="text-zinc-400 text-sm">
          {data.total} {data.total === 1 ? 'publicación' : 'publicaciones'}
        </span>
      </div>

      {data.posts.length === 0 ? (
        <p className="text-zinc-400 text-sm">
          No hay publicaciones con esta etiqueta todavía.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
