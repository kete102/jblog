import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

// ─── Placeholder root ─────────────────────────────────────────────────────────
// Phase 3 will replace this with TanStack Router + Query.

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <p className="text-zinc-500 text-sm">jblog — SPA en construcción</p>
    </div>
  )
}

const root = document.getElementById('root')!
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
