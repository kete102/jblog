import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PostList } from '../../components/dashboard/PostList'
import { BecomeAuthorForm } from '../../components/dashboard/BecomeAuthorForm'
import { dashboardPostsOptions, becomeAuthorOptions } from '../../lib/api'

// ─── Dashboard home — author sees post list, others see become-author form ────

export const Route = createFileRoute('/dashboard/')({
  component: DashboardIndexPage,
})

function DashboardIndexPage() {
  const { me } = Route.useRouteContext() as { me: import('../../types').Me }
  const isAuthorOrAdmin = me.role === 'author' || me.role === 'admin'

  // Load the right dataset based on role
  const postsQuery = useQuery({ ...dashboardPostsOptions, enabled: isAuthorOrAdmin })
  const becomeAuthorQuery = useQuery({ ...becomeAuthorOptions, enabled: !isAuthorOrAdmin })

  if (isAuthorOrAdmin) {
    if (postsQuery.isLoading) {
      return <p className="text-base-content/50 text-sm">Cargando publicaciones…</p>
    }
    if (postsQuery.isError || postsQuery.data === undefined) {
      return <p className="text-error text-sm">No se pudieron cargar las publicaciones.</p>
    }
    return <PostList initialPosts={postsQuery.data} />
  }

  // reader / pending / rejected
  if (becomeAuthorQuery.isLoading) {
    return <p className="text-base-content/50 text-sm">Cargando…</p>
  }
  if (becomeAuthorQuery.isError || becomeAuthorQuery.data === undefined) {
    return <p className="text-error text-sm">No se pudo cargar el formulario.</p>
  }
  return <BecomeAuthorForm initialData={becomeAuthorQuery.data} />
}
