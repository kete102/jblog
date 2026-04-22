import React from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AdminRequestList } from '../../components/dashboard/AdminRequestList'
import { adminRequestsOptions } from '../../lib/api'

// ─── Admin page — list + approve/reject pending author requests ───────────────

export const Route = createFileRoute('/dashboard/admin')({
  beforeLoad: ({ context }) => {
    // Access me from the parent dashboard route context
    const me = (context as { me?: import('../../types').Me }).me
    if (!me || me.role !== 'admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(adminRequestsOptions),
  component: AdminPage,
})

function AdminPage() {
  const { data, isLoading, isError } = useQuery(adminRequestsOptions)

  if (isLoading) {
    return <p className="text-base-content/50 text-sm">Cargando solicitudes…</p>
  }

  if (isError || !data) {
    return <p className="text-error text-sm">No se pudieron cargar las solicitudes.</p>
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-base-content mb-6">Solicitudes de autor</h1>
      <AdminRequestList initialRequests={data} />
    </div>
  )
}
