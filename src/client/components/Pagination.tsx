// ─── Pagination — prev / next page controls ───────────────────────────────────
import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  hasPrev: boolean
  hasNext: boolean
  onPage: (page: number) => void
}

export function Pagination({ page, totalPages, hasPrev, hasNext, onPage }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Paginación">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={!hasPrev}
        aria-label="Página anterior"
        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Anterior
      </button>

      <span className="text-sm text-zinc-500">
        {page} / {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={!hasNext}
        aria-label="Página siguiente"
        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Siguiente
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}
