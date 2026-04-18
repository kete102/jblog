import React from 'react'
import type { User } from '@/db/schema'

interface NavbarProps {
  user?: User | null
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 group">
          <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm group-hover:bg-indigo-700 transition-colors">
            j
          </span>
          <span className="font-semibold text-zinc-900 tracking-tight">jblog</span>
        </a>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {(user.role === 'author' || user.role === 'admin') && (
                <a
                  href="/dashboard"
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100"
                >
                  Dashboard
                </a>
              )}
              <div className="relative group">
                <button className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-zinc-100"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-zinc-100 py-1 opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all">
                  <div className="px-3 py-2 border-b border-zinc-100">
                    <p className="text-sm font-medium text-zinc-900 truncate">{user.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                  </div>
                  {(user.role === 'author' || user.role === 'admin') && (
                    <a
                      href="/dashboard"
                      className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      Dashboard
                    </a>
                  )}
                  <a
                    href="/dashboard/profile"
                    className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    Profile
                  </a>
                  {user.role === 'admin' && (
                    <a
                      href="/dashboard/admin"
                      className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      Admin
                    </a>
                  )}
                  <div className="border-t border-zinc-100 mt-1">
                    <form method="POST" action="/auth/logout">
                      <button
                        type="submit"
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Sign out
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <a
              href="/auth/google"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium transition-all duration-200 hover:bg-indigo-700 hover:scale-[1.04] active:scale-[0.97]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in
            </a>
          )}
        </div>
      </nav>
    </header>
  )
}
