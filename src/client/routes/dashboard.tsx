import React from 'react'
import { createFileRoute, Outlet, redirect, Link } from '@tanstack/react-router'
import { LayoutDashboard, FileText, User, Shield, PenSquare } from 'lucide-react'
import { meOptions } from '../lib/api'
import { usePageTitle } from '../lib/usePageTitle'
import type { Me } from '../types'

// ─── Dashboard parent route + auth guard ─────────────────────────────────────
// This file lives alongside the dashboard/ directory. TanStack Router
// treats it as the parent layout for all /dashboard/* child routes.
//
// beforeLoad fetches the current user. Unauthenticated visitors are
// redirected to / (auth happens server-side via Google OAuth at /auth/google).
// The resolved `me` is returned into router context so child routes can access
// it without re-fetching.

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.fetchQuery(meOptions)

    if (!me) {
      throw redirect({ to: '/' })
    }

    return { me }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  const { me } = Route.useRouteContext()
  usePageTitle('Dashboard')

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 flex flex-col gap-1 p-4">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-2">
          Dashboard
        </p>

        <SideLink to="/dashboard/" icon={<LayoutDashboard className="w-4 h-4" />} label="Inicio" />
        <SideLink to="/dashboard/profile" icon={<User className="w-4 h-4" />} label="Perfil" />

        {(me.role === 'author' || me.role === 'admin') && (
          <>
            <SideLink
              to="/dashboard/post/new"
              icon={<PenSquare className="w-4 h-4" />}
              label="Nueva publicación"
            />
            <SideLink
              to="/dashboard/"
              icon={<FileText className="w-4 h-4" />}
              label="Mis publicaciones"
            />
          </>
        )}

        {me.role === 'admin' && (
          <SideLink
            to="/dashboard/admin"
            icon={<Shield className="w-4 h-4" />}
            label="Administración"
          />
        )}
      </aside>

      {/* Page content */}
      <div className="flex-1 min-w-0 p-6">
        <Outlet />
      </div>
    </div>
  )
}

// ─── Sidebar nav link ─────────────────────────────────────────────────────────

function SideLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === '/dashboard/' }}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors [&.active]:bg-indigo-50 [&.active]:text-indigo-700 [&.active]:font-medium"
    >
      {icon}
      {label}
    </Link>
  )
}
