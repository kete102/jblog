import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ProfileForm } from '../../components/dashboard/ProfileForm'
import { dashboardProfileOptions } from '../../lib/api'

// ─── Dashboard profile page ───────────────────────────────────────────────────

export const Route = createFileRoute('/dashboard/profile')({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardProfileOptions),
  component: ProfilePage,
})

function ProfilePage() {
  const { data, isLoading, isError } = useQuery(dashboardProfileOptions)

  if (isLoading) {
    return <p className="text-zinc-400 text-sm">Cargando perfil…</p>
  }

  if (isError || !data) {
    return <p className="text-red-500 text-sm">No se pudo cargar el perfil.</p>
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Mi perfil</h1>
      <ProfileForm initialData={data} />
    </div>
  )
}
