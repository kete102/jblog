// ─── Navbar — state-driven top navigation bar ─────────────────────────────────
import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, LogIn, Menu, X, PenSquare } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Me } from '../types'
import ThemeController from './ThemeController'
import { cn } from '../lib/cn'

const SITE_NAME = 'jblog'

async function fetchMe(): Promise<Me | null> {
  try {
    const res = await fetch('/api/me', { credentials: 'include' })
    return res.ok ? (res.json() as Promise<Me>) : null
  } catch {
    return null
  }
}

const navLinkClass = cn(
  'px-3 py-1.5 rounded-lg text-sm text-base-content/70',
  'hover:text-base-content hover:bg-base-200 transition-colors',
)

const mobileLinkClass = cn(
  'px-3 py-2 rounded-lg text-sm text-base-content/80',
  'hover:bg-base-200 transition-colors',
)

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: me } = useQuery<Me | null>({
    queryKey: ['me'],
    queryFn: fetchMe,
    staleTime: 60_000,
  })

  const isAuthor = me?.role === 'author' || me?.role === 'admin'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-base-300 bg-base-100/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-lg font-bold text-base-content hover:text-primary transition-colors tracking-tight"
        >
          {SITE_NAME}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/" className={navLinkClass}>Inicio</Link>
          <Link to="/changelog" className={navLinkClass}>Changelog</Link>
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeController />
          {me ? (
            <>
              {isAuthor && (
                <Link to="/dashboard" className={cn(navLinkClass, 'inline-flex items-center gap-1.5')}>
                  <LayoutDashboard className="w-4 h-4" />
                  Panel
                </Link>
              )}
              {isAuthor && (
                <Link
                  to="/dashboard/post/new"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-content text-sm font-medium hover:bg-primary/90 transition-colors"
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
                    className="w-8 h-8 rounded-full object-cover border-2 border-base-300 hover:border-primary/40 transition-colors"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center border-2 border-base-300 hover:border-primary/40 transition-colors">
                    <span className="text-sm font-medium text-base-content/70">
                      {me.name[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </Link>
            </>
          ) : (
            <a href="/auth/google" className={cn(navLinkClass, 'inline-flex items-center gap-1.5')}>
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
          className="md:hidden p-2 rounded-lg text-base-content/70 hover:bg-base-200 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu — animated with Framer Motion */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="md:hidden border-t border-base-200 bg-base-100 px-4 pb-4 pt-2 flex flex-col gap-1"
          >
            <Link to="/" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
              Inicio
            </Link>
            <Link to="/changelog" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
              Changelog
            </Link>
            {me && isAuthor && (
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
                Panel
              </Link>
            )}
            {!me && (
              <a href="/auth/google" className={mobileLinkClass}>
                Entrar con Google
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
