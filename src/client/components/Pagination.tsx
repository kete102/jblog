// ─── Pagination — prev / next page controls ───────────────────────────────────
import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/cn'

interface PaginationProps {
  page: number
  totalPages: number
  hasPrev: boolean
  hasNext: boolean
  onPage: (page: number) => void
}

const btnClass = cn(
  'inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium',
  'text-base-content/70 hover:bg-base-200 transition-colors',
  'disabled:opacity-40 disabled:cursor-not-allowed',
)

export function Pagination({ page, totalPages, hasPrev, hasNext, onPage }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Paginación">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={!hasPrev}
        aria-label="Página anterior"
        className={btnClass}
      >
        <ChevronLeft className="w-4 h-4" />
        Anterior
      </button>

      <span className="text-sm text-base-content/60">
        {page} / {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={!hasNext}
        aria-label="Página siguiente"
        className={btnClass}
      >
        Siguiente
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}
