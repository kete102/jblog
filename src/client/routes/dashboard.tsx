import React from 'react'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import type { Me } from '../types'

// ─── Dashboard parent route + auth guard ─────────────────────────────────────
// This file lives alongside the dashboard/ directory. TanStack Router
// treats it as the parent layout for all /dashboard/* child routes.
//
// beforeLoad fetches the current user. Unauthenticated visitors are
// redirected to / (auth happens server-side via Google OAuth at /auth/google).
//
// NOTE: Uses plain fetch here because the typed Hono RPC client (api) requires
// a clean API-router-only AppType to infer correctly. That will be wired up
// properly in Phase 5 once we extract the API type cleanly.

async function fetchMe(): Promise<Me | null> {
  try {
    const res = await fetch('/api/me', { credentials: 'include' })
    if (!res.ok) return null
    return res.json() as Promise<Me>
  } catch {
    return null
  }
}

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.fetchQuery({
      queryKey: ['me'],
      queryFn: fetchMe,
      staleTime: 30_000,
    })

    if (!me) {
      throw redirect({ to: '/' })
    }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  return <Outlet />
}
