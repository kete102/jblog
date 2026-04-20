import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

// Phase 5: fetches GET /api/posts?tag=:slug

export const Route = createFileRoute('/tag/$slug')({
  component: TagPage,
})

function TagPage() {
  const { slug } = Route.useParams()
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <p className="text-zinc-400 text-sm">Etiqueta: {slug}</p>
    </div>
  )
}
