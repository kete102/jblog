import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

// Phase 5: fetches GET /api/dashboard/admin (admin-only)

export const Route = createFileRoute('/dashboard/admin')({
  component: AdminPage,
})

function AdminPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <p className="text-zinc-400 text-sm">Panel de administración</p>
    </div>
  )
}
