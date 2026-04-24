import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutDashboard, LogIn, Menu, PenSquare, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/cn'
import ThemeController from './ThemeController'
import { useUser } from '../hooks/useUser'

const navLinkClass = cn(
  'px-3 py-1.5 rounded-lg text-sm text-base-content/70',
  'hover:text-base-content hover:bg-base-300 transition-colors',
)

const mobileLinkClass = cn(
  'px-3 py-2 rounded-lg text-sm text-base-content/80',
  'hover:bg-base-200 transition-colors',
)

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { me, isAuthor, isAdmin } = useUser()

  return (
    <header className="sticky top-0 z-50 w-full p-4 rounded-lg bg-base-100/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 bg-base-300/60 rounded-xl p-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          viewTransition
          className="text-lg font-bold text-base-content hover:text-primary transition-colors tracking-tight"
        >
          Desteollos de Luz
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/" viewTransition className={navLinkClass}>
            Inicio
          </Link>
          <Link to="/categories" viewTransition className={navLinkClass}>
            Categorias
          </Link>
          <Link to="/contributors" viewTransition className={navLinkClass}>
            Autores
          </Link>
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeController />
          {me ? (
            <>
              {isAuthor && (
                <Link
                  viewTransition
                  to="/dashboard"
                  className={cn(navLinkClass, 'inline-flex items-center gap-1.5')}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Panel
                </Link>
              )}
              {isAuthor && (
                <Link
                  to="/dashboard/post/new"
                  viewTransition
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-content text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <PenSquare className="w-4 h-4" />
                  Escribir
                </Link>
              )}
              {/* Avatar */}
              <Link to="/dashboard" viewTransition className="ml-1" aria-label="Mi perfil">
                {me.avatarUrl ? (
                  <img
                    src={me.avatarUrl}
                    alt={me.name}
                    className="size-10 rounded-full object-cover border-2 border-base-300 hover:border-primary/40 transition-colors"
                  />
                ) : (
                  <div className="size-10 rounded-full bg-base-300 flex items-center justify-center border-2 border-base-300 hover:border-primary/40 transition-colors">
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
            <Link
              to="/"
              viewTransition
              onClick={() => setMobileOpen(false)}
              className={mobileLinkClass}
            >
              Inicio
            </Link>
            <Link
              to="/changelog"
              viewTransition
              onClick={() => setMobileOpen(false)}
              className={mobileLinkClass}
            >
              Changelog
            </Link>
            {me && isAuthor && (
              <Link
                to="/dashboard"
                viewTransition
                onClick={() => setMobileOpen(false)}
                className={mobileLinkClass}
              >
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
