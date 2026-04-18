import React from 'react'
import Logo from '@/components/layout/Logo'
import Avatar from '@/components/blog/Avatar'
import { XIcon, MenuIcon, DocumentIcon, UserIcon, UsersIcon, SignOutIcon } from '@/components/icons'
import { isVerifiedAuthor } from '@/lib/roles'
import type { User } from '@/db/schema'

interface DashboardShellProps {
  user: User
  children: React.ReactNode
  active?: 'posts' | 'profile' | 'admin'
}

export default function DashboardShell({ user, children, active }: DashboardShellProps) {
  return (
    <div className="h-screen overflow-hidden flex">
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
          <Logo />
          {/* Close button — mobile only */}
          <label
            htmlFor="sidebar-toggle"
            className="ml-auto p-1 rounded-lg hover:bg-zinc-100 cursor-pointer md:hidden"
            aria-label="Close sidebar"
          >
            <XIcon className="w-5 h-5 text-zinc-500" />
          </label>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {isVerifiedAuthor(user) && (
            <a
              href="/dashboard"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active === 'posts'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <DocumentIcon className="w-4 h-4 shrink-0" />
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
            <UserIcon className="w-4 h-4 shrink-0" />
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
              <UsersIcon className="w-4 h-4 shrink-0" />
              Admin
            </a>
          )}
        </nav>

        {/* User info + sign out */}
        <div className="p-3 border-t border-zinc-200 shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
            <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
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
              <SignOutIcon className="w-3.5 h-3.5" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        {/* Mobile topbar — hidden on md+ */}
        <div className="md:hidden h-14 shrink-0 flex items-center gap-3 px-4 border-b border-zinc-200 bg-white">
          <label
            htmlFor="sidebar-toggle"
            className="-ml-1 p-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer"
            aria-label="Open menu"
          >
            <MenuIcon className="w-5 h-5 text-zinc-700" />
          </label>
          <Logo />
        </div>

        {children}
      </main>
    </div>
  )
}
