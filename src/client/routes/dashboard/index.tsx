import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

// Phase 5: fetches GET /api/dashboard/posts

export const Route = createFileRoute('/dashboard/')({
  component: DashboardIndexPage,
})

function DashboardIndexPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <p className="text-zinc-400 text-sm">Cargando publicaciones…</p>
    </div>
  )
}
