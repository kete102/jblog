import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

// Phase 5 will replace this placeholder with paginated post cards
// fetched from GET /api/posts?page=N

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <p className="text-zinc-400 text-sm">Cargando publicaciones…</p>
    </div>
  )
}
