import React from 'react'
import type { User } from '@/db/schema'

interface DashboardShellProps {
  user: User
  children: React.ReactNode
  active?: 'posts' | 'profile' | 'admin'
}

export default function DashboardShell({ user, children, active }: DashboardShellProps) {
  return (
    <div className="min-h-screen flex">
      {/* CSS-only sidebar toggle — peer for backdrop + sidebar */}
      <input type="checkbox" id="sidebar-toggle" className="peer hidden" />

      {/* Backdrop — mobile only, visible when checkbox is checked */}
      <label
        htmlFor="sidebar-toggle"
        className="fixed inset-0 bg-black/40 z-20 opacity-0 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto transition-opacity md:hidden"
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 flex flex-col -translate-x-full peer-checked:translate-x-0 transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:z-auto">
        {/* Logo row */}
        <div className="h-14 flex items-center px-5 border-b border-zinc-200 shrink-0">
          <a href="/" className="flex items-center gap-2 group">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm group-hover:bg-indigo-700 transition-colors">
              j
            </span>
            <span className="font-semibold text-zinc-900 tracking-tight">jblog</span>
          </a>
          {/* Close button — mobile only */}
          <label
            htmlFor="sidebar-toggle"
            className="ml-auto p-1 rounded-lg hover:bg-zinc-100 cursor-pointer md:hidden"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </label>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {(user.role === 'author' || user.role === 'admin') && (
            <a
              href="/dashboard"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active === 'posts'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Posts
            </a>
          )}

          <a
            href="/dashboard/profile"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active === 'profile'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </a>

          {user.role === 'admin' && (
            <a
              href="/dashboard/admin"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active === 'admin'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin
            </a>
          )}
        </nav>

        {/* User info + sign out */}
        <div className="p-3 border-t border-zinc-200 shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-900 truncate">{user.name}</p>
              <p className="text-xs text-zinc-400 truncate capitalize">
                {user.role === 'reader' ? 'Reader' : user.role === 'pending' ? 'Pending review' : user.role}
              </p>
            </div>
          </div>
          <form method="POST" action="/auth/logout">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile topbar — hidden on md+ */}
        <div className="md:hidden h-14 shrink-0 flex items-center gap-3 px-4 border-b border-zinc-200 bg-white">
          <label
            htmlFor="sidebar-toggle"
            className="-ml-1 p-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
          <a href="/" className="flex items-center gap-2 group">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm group-hover:bg-indigo-700 transition-colors">
              j
            </span>
            <span className="font-semibold text-zinc-900 tracking-tight">jblog</span>
          </a>
        </div>

        {children}
      </main>
    </div>
  )
}
