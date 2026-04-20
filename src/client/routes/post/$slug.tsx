import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

// Phase 5: fetches GET /api/posts/:slug

export const Route = createFileRoute('/post/$slug')({
  component: PostPage,
})

function PostPage() {
  const { slug } = Route.useParams()
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <p className="text-zinc-400 text-sm">Cargando post: {slug}…</p>
    </div>
  )
}
