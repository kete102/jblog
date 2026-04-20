import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

// Phase 5: fetches GET /api/authors/:authorId

export const Route = createFileRoute('/author/$authorId')({
  component: AuthorPage,
})

function AuthorPage() {
  const { authorId } = Route.useParams()
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <p className="text-zinc-400 text-sm">Autor: {authorId}</p>
    </div>
  )
}
