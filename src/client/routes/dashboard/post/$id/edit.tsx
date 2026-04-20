import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

// Phase 5: fetches GET /api/dashboard/posts/:id and PUT /api/dashboard/posts/:id
// Renders the Tiptap editor pre-populated with existing post data.

export const Route = createFileRoute('/dashboard/post/$id/edit')({
  component: EditPostPage,
})

function EditPostPage() {
  const { id } = Route.useParams()
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <p className="text-zinc-400 text-sm">Editando post {id}…</p>
    </div>
  )
}
