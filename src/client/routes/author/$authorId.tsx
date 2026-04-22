import React from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AuthorCard } from '../../components/AuthorCard'
import { PostCard } from '../../components/PostCard'
import { authorOptions } from '../../lib/api'
import { usePageTitle } from '../../lib/usePageTitle'
import type { PostSummary } from '../../types'

// ─── Author public profile page ───────────────────────────────────────────────

export const Route = createFileRoute('/author/$authorId')({
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.ensureQueryData(authorOptions(params.authorId))
    } catch {
      throw notFound()
    }
  },
  component: AuthorPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center text-base-content/60">
      Autor no encontrado.
    </div>
  ),
})

function AuthorPage() {
  const { authorId } = Route.useParams()
  const { data, isLoading, isError } = useQuery(authorOptions(authorId))
  usePageTitle(data?.author.name)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-base-content/50 text-sm">Cargando perfil…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-error text-sm">No se pudo cargar el perfil.</p>
      </div>
    )
  }

  // The author page endpoint returns a stripped PostSummary without `author`
  // and without `status`. We need to hydrate each post with the full author
  // and a dummy status so PostCard gets the right shape.
  const posts: PostSummary[] = data.posts.map((p) => ({
    ...p,
    status: 'published' as const,
    author: {
      id: data.author.id,
      name: data.author.name,
      avatarUrl: data.author.avatarUrl,
      publishedPostCount: data.author.publishedPostCount,
    },
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-10">
        <AuthorCard author={data.author} linkToProfile={false} />
      </div>

      <h2 className="text-xl font-semibold text-base-content mb-6">Publicaciones ({posts.length})</h2>

      {posts.length === 0 ? (
        <p className="text-base-content/50 text-sm">Este autor todavía no ha publicado nada.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
