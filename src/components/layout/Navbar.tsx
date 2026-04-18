import React from 'react'
import Logo from '@/components/layout/Logo'
import Avatar from '@/components/blog/Avatar'
import { GoogleIcon } from '@/components/icons'
import { isVerifiedAuthor } from '@/lib/roles'
import type { User } from '@/db/schema'

interface NavbarProps {
  user?: User | null
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo />

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {isVerifiedAuthor(user) && (
                <a
                  href="/dashboard"
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100"
                >
                  Dashboard
                </a>
              )}
              <div className="relative group">
                <button className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer">
                  <Avatar name={user.name} avatarUrl={user.avatarUrl} size="md" ring />
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-zinc-100 py-1 opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all">
                  <div className="px-3 py-2 border-b border-zinc-100">
                    <p className="text-sm font-medium text-zinc-900 truncate">{user.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                  </div>
                  {isVerifiedAuthor(user) && (
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
              <GoogleIcon className="w-4 h-4" />
              Sign in
            </a>
          )}
        </div>
      </nav>
    </header>
  )
}
