import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

// Phase 5: fetches GET /api/dashboard/profile and handles PUT/DELETE

export const Route = createFileRoute('/dashboard/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <p className="text-zinc-400 text-sm">Cargando perfil…</p>
    </div>
  )
}
