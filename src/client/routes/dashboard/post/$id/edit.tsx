import React from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PostEditor } from '../../../../components/dashboard/PostEditor'
import { dashboardPostEditOptions } from '../../../../lib/api'

// ─── Edit post — pre-populated editor ────────────────────────────────────────

export const Route = createFileRoute('/dashboard/post/$id/edit')({
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.ensureQueryData(dashboardPostEditOptions(params.id))
    } catch {
      throw notFound()
    }
  },
  component: EditPostPage,
  notFoundComponent: () => <div className="text-zinc-500 text-sm">Publicación no encontrada.</div>,
})

function EditPostPage() {
  const { id } = Route.useParams()
  const { data, isLoading, isError } = useQuery(dashboardPostEditOptions(id))

  if (isLoading) {
    return <p className="text-zinc-400 text-sm">Cargando editor…</p>
  }

  if (isError || !data) {
    return <p className="text-red-500 text-sm">No se pudo cargar la publicación.</p>
  }

  const { post, allTags } = data

  return (
    <PostEditor
      postId={post.id}
      title={post.title}
      slug={post.slug}
      excerpt={post.excerpt ?? undefined}
      coverImageUrl={post.coverImageUrl ?? undefined}
      content={post.content}
      status={post.status}
      tagIds={post.tagIds}
      allTags={allTags}
    />
  )
}
