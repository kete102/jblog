import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'
import { queryClient } from './query-client'
import './styles.css'

// ─── Router ───────────────────────────────────────────────────────────────────
// The query client is passed as router context so route loaders (beforeLoad)
// can prefetch data with the same cache used by useQuery() in components.

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// ─── Type registration ────────────────────────────────────────────────────────
// Required by TanStack Router for full TypeScript inference across routes.

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// ─── Mount ────────────────────────────────────────────────────────────────────

const root = document.getElementById('root')!
createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
)
