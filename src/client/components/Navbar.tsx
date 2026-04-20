// ─── Navbar — state-driven top navigation bar ─────────────────────────────────
// Reads the current user from the ['me'] query (seeded by the dashboard auth
// guard) — no separate fetch needed on public pages, just a cache read.
import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, LogIn, Menu, X, PenSquare } from 'lucide-react'
import type { Me } from '../types'

const SITE_NAME = 'jblog'

async function fetchMe(): Promise<Me | null> {
  try {
    const res = await fetch('/api/me', { credentials: 'include' })
    return res.ok ? (res.json() as Promise<Me>) : null
  } catch {
    return null
  }
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: me } = useQuery<Me | null>({
    queryKey: ['me'],
    queryFn: fetchMe,
    staleTime: 60_000,
  })

  const isAuthor = me?.role === 'author' || me?.role === 'admin'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-lg font-bold text-zinc-900 hover:text-indigo-700 transition-colors tracking-tight"
        >
          {SITE_NAME}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Inicio
          </Link>
          <Link
            to="/changelog"
            className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Changelog
          </Link>
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2">
          {me ? (
            <>
              {isAuthor && (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Panel
                </Link>
              )}
              {isAuthor && (
                <Link
                  to="/dashboard/post/new"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  <PenSquare className="w-4 h-4" />
                  Escribir
                </Link>
              )}
              {/* Avatar */}
              <Link to="/dashboard" className="ml-1" aria-label="Mi perfil">
                {me.avatarUrl ? (
                  <img
                    src={me.avatarUrl}
                    alt={me.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-zinc-200 hover:border-indigo-400 transition-colors"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center border-2 border-zinc-200 hover:border-indigo-400 transition-colors">
                    <span className="text-sm font-medium text-zinc-600">
                      {me.name[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </Link>
            </>
          ) : (
            <a
              href="/auth/google"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Entrar
            </a>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Menú"
          className="md:hidden p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-100 bg-white px-4 pb-4 pt-2 flex flex-col gap-1">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            Inicio
          </Link>
          <Link
            to="/changelog"
            onClick={() => setMobileOpen(false)}
            className="px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            Changelog
          </Link>
          {me && isAuthor && (
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Panel
            </Link>
          )}
          {!me && (
            <a
              href="/auth/google"
              className="px-3 py-2 rounded-lg text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Entrar con Google
            </a>
          )}
        </div>
      )}
    </header>
  )
}
