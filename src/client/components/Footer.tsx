import { Link } from '@tanstack/react-router'

const NAV_LINKS = [
  { to: '/' as const, label: 'Inicio' },
  { to: '/categories' as const, label: 'Categorias' },
  { to: '/contributors' as const, label: 'Autores' },
]

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-base-300 bg-base-100">
      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-8">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          {/* Brand */}
          <div className="flex flex-col gap-1.5">
            <Link
              to="/"
              viewTransition
              className="text-base font-bold text-base-content hover:text-primary transition-colors tracking-tight"
            >
              Destellos de Luz
            </Link>
            <p className="text-sm text-base-content/50 max-w-xs leading-relaxed">
              Reflexiones, historias y palabras que inspiran el camino.
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-base-content/40">
              Explorar
            </p>
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                viewTransition
                className="text-sm text-base-content/60 hover:text-base-content transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-base-200">
          <p className="text-xs text-base-content/40">
            &copy; {year} Destellos de Luz. Todos los derechos reservados.
          </p>
          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-base-content/40 hover:text-base-content transition-colors"
          >
            <InstagramIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  )
}
