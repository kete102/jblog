import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PostEditor } from '../../../components/dashboard/PostEditor'
import { dashboardTagsOptions } from '../../../lib/api'

// ─── New post — empty editor ──────────────────────────────────────────────────

export const Route = createFileRoute('/dashboard/post/new')({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardTagsOptions),
  component: NewPostPage,
})

function NewPostPage() {
  const { data: allTags, isLoading, isError } = useQuery(dashboardTagsOptions)

  if (isLoading) {
    return <p className="text-base-content/50 text-sm">Cargando editor…</p>
  }

  if (isError || !allTags) {
    return <p className="text-error text-sm">No se pudo cargar el editor.</p>
  }

  return <PostEditor allTags={allTags} />
}
