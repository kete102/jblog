import React from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PostContent } from '../../components/PostContent'
import { LikeButton } from '../../components/LikeButton'
import { CopyLinkButton } from '../../components/CopyLinkButton'
import { AuthorCard } from '../../components/AuthorCard'
import { CommentSection } from '../../components/CommentSection'
import { postOptions, meOptions } from '../../lib/api'
import { usePageTitle } from '../../lib/usePageTitle'

// ─── Post detail page ─────────────────────────────────────────────────────────

export const Route = createFileRoute('/post/$slug')({
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.ensureQueryData(postOptions(params.slug))
    } catch {
      throw notFound()
    }
  },
  component: PostPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center text-zinc-500">
      Publicación no encontrada.
    </div>
  ),
})

function PostPage() {
  const { slug } = Route.useParams()
  const { data, isLoading, isError } = useQuery(postOptions(slug))
  const { data: me = null } = useQuery(meOptions)
  usePageTitle(data?.post.title)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Cargando publicación…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-sm">No se pudo cargar la publicación.</p>
      </div>
    )
  }

  const { post, comments, liked } = data

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Cover image */}
      {post.coverImageUrl && (
        <div className="rounded-2xl overflow-hidden mb-8 aspect-video">
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Title */}
      <h1 className="text-4xl font-bold text-zinc-900 leading-tight mb-4">{post.title}</h1>

      {/* Actions row */}
      <div className="flex items-center gap-3 mb-8">
        <LikeButton slug={post.slug} initialLiked={liked} initialLikes={post.likes} />
        <CopyLinkButton />
      </div>

      {/* Content */}
      <article className="prose prose-zinc max-w-none mb-12">
        <PostContent doc={post.content} />
      </article>

      {/* Author */}
      <div className="mb-12">
        <AuthorCard author={post.author} />
      </div>

      {/* Comments */}
      <CommentSection postSlug={post.slug} initialThreads={comments} me={me} />
    </div>
  )
}
