import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

// Phase 5: fetches GET /api/changelog and renders with marked client-side

export const Route = createFileRoute('/changelog')({
  component: ChangelogPage,
})

function ChangelogPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <p className="text-zinc-400 text-sm">Cargando changelog…</p>
    </div>
  )
}
