import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

// Phase 5: POST /api/dashboard/posts (create new post)
// Renders the Tiptap editor with an empty document.

export const Route = createFileRoute('/dashboard/post/new')({
  component: NewPostPage,
})

function NewPostPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <p className="text-zinc-400 text-sm">Editor de nueva publicación</p>
    </div>
  )
}
