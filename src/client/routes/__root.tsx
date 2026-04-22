import React from 'react'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { Navbar } from '../components/Navbar'

// ─── Router context ───────────────────────────────────────────────────────────

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

// ─── Dev-only devtools — lazy loaded so the import is dead-code-eliminated
// in production builds. React.lazy + Suspense means zero production cost.

const RouterDevtools = import.meta.env.PROD
  ? () => null
  : React.lazy(() =>
      import('@tanstack/router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )

const QueryDevtools = import.meta.env.PROD
  ? () => null
  : React.lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({
        default: m.ReactQueryDevtools,
      })),
    )

function RootLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <React.Suspense>
        <RouterDevtools position="bottom-right" />
        <QueryDevtools buttonPosition="bottom-left" />
      </React.Suspense>
    </>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-base-content/70">
      <p className="text-4xl font-bold text-base-content">404</p>
      <p>Página no encontrada</p>
      <Link to="/" className="text-sm underline underline-offset-2 hover:text-base-content">
        Volver al inicio
      </Link>
    </div>
  )
}
