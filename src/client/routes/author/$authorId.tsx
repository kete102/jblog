import { useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Eye, Heart, BookOpen, ArrowUpDown } from 'lucide-react'
import { AuthorCard } from '../../components/AuthorCard'
import { CountUp } from '../../components/CountUp'
import { PostCard } from '../../components/PostCard'
import { authorOptions } from '../../lib/api'
import { usePageTitle } from '../../lib/usePageTitle'
import { cn } from '../../lib/cn'
import type { PostSummary } from '../../types'

// ─── Author public profile page ───────────────────────────────────────────────

export const Route = createFileRoute('/author/$authorId')({
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.ensureQueryData(authorOptions(params.authorId))
    } catch (err) {
      // Only treat a real 404 as "not found". Any other error (network,
      // server 500, etc.) should surface as a proper error so the isError
      // branch in the component can render a useful message.
      if (err instanceof Error && err.message.startsWith('404')) {
        throw notFound()
      }
      throw err
    }
  },
  component: AuthorPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center text-base-content/60">
      Autor no encontrado.
    </div>
  ),
})

type SortKey = 'date' | 'likes' | 'views'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date', label: 'Fecha' },
  { key: 'likes', label: 'Likes' },
  { key: 'views', label: 'Vistas' },
]

function sortPosts(posts: PostSummary[], by: SortKey): PostSummary[] {
  return [...posts].sort((a, b) => {
    if (by === 'likes') return b.likes - a.likes
    if (by === 'views') return b.views - a.views
    // date — nulls last
    if (!a.publishedAt) return 1
    if (!b.publishedAt) return -1
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })
}

function AuthorPage() {
  const { authorId } = Route.useParams()
  const { data, isLoading, isError } = useQuery(authorOptions(authorId))
  const [sortBy, setSortBy] = useState<SortKey>('date')
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

  const totalViews = posts.reduce((sum, p) => sum + p.views, 0)
  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0)
  const sorted = sortPosts(posts, sortBy)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Author bio card */}
      <div className="mb-6">
        <AuthorCard author={data.author} linkToProfile={false} nameViewTransition={`author-name-${data.author.id}`} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        <div className="flex flex-col items-center gap-1 p-4 rounded-2xl border border-base-300 bg-base-100">
          <BookOpen className="w-4 h-4 text-base-content/40" />
          <span className="text-xl font-bold text-base-content tabular-nums">
            <CountUp to={posts.length} />
          </span>
          <span className="text-xs text-base-content/50">
            {posts.length === 1 ? 'publicación' : 'publicaciones'}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 p-4 rounded-2xl border border-base-300 bg-base-100">
          <Eye className="w-4 h-4 text-base-content/40" />
          <span className="text-xl font-bold text-base-content tabular-nums">
            <CountUp to={totalViews} />
          </span>
          <span className="text-xs text-base-content/50">vistas totales</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-4 rounded-2xl border border-base-300 bg-base-100">
          <Heart className="w-4 h-4 text-base-content/40" />
          <span className="text-xl font-bold text-base-content tabular-nums">
            <CountUp to={totalLikes} />
          </span>
          <span className="text-xs text-base-content/50">likes totales</span>
        </div>
      </div>

      {/* Posts header + sort */}
      {posts.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-base-content">
              Publicaciones ({posts.length})
            </h2>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-base-200">
              <ArrowUpDown className="w-3.5 h-3.5 text-base-content/40 ml-1.5" />
              {SORT_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSortBy(key)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                    sortBy === key
                      ? 'bg-base-100 text-base-content shadow-sm'
                      : 'text-base-content/50 hover:text-base-content',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </>
      )}

      {posts.length === 0 && (
        <p className="text-base-content/50 text-sm">Este autor todavía no ha publicado nada.</p>
      )}
    </div>
  )
}
