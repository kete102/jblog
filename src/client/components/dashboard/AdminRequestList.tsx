// ─── AdminRequestList — approve / reject author requests ─────────────────────
import React, { useState } from 'react'
import { Check, X } from 'lucide-react'
import { formatDate } from '../../lib/format'
import type { AuthorRequestDetails } from '../../types'

interface AdminRequestListProps {
  initialRequests: AuthorRequestDetails[]
}

export function AdminRequestList({ initialRequests }: AdminRequestListProps) {
  const [requests, setRequests] = useState<AuthorRequestDetails[]>(initialRequests)
  const [busy, setBusy] = useState<string | null>(null)

  const approve = async (id: string) => {
    if (busy) return
    setBusy(id)
    try {
      const res = await fetch(`/api/dashboard/admin/approve/${id}`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error()
      setRequests((prev) => prev.filter((r) => r.id !== id))
    } catch {
      // Silently fail
    } finally {
      setBusy(null)
    }
  }

  const reject = async (id: string) => {
    if (busy) return
    const reason = window.prompt('Motivo de rechazo (opcional):')
    if (reason === null) return // cancelled
    setBusy(id)
    try {
      const res = await fetch(`/api/dashboard/admin/reject/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: reason || undefined }),
      })
      if (!res.ok) throw new Error()
      setRequests((prev) => prev.filter((r) => r.id !== id))
    } catch {
      // Silently fail
    } finally {
      setBusy(null)
    }
  }

  if (requests.length === 0) {
    return <p className="text-sm text-zinc-500 py-8 text-center">No hay solicitudes pendientes.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {requests.map((req) => {
        const isBusy = busy === req.id

        return (
          <div
            key={req.id}
            className="flex flex-col gap-4 p-5 rounded-xl border border-zinc-200 bg-white"
          >
            {/* User info */}
            <div className="flex items-center gap-3">
              {req.avatarUrl ? (
                <img
                  src={req.avatarUrl}
                  alt={req.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center">
                  <span className="font-semibold text-zinc-500">{req.name[0]?.toUpperCase()}</span>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-zinc-900">{req.name}</p>
                <p className="text-xs text-zinc-500">{req.email}</p>
                <p className="text-xs text-zinc-400">
                  Solicitado el {formatDate(req.createdAt, 'short')}
                </p>
              </div>
            </div>

            {/* Author request details */}
            {req.authorRequest && (
              <div className="flex flex-col gap-2 text-sm">
                <div>
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                    Biografía
                  </span>
                  <p className="text-zinc-700 mt-0.5">{req.authorRequest.bio}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                    Temáticas
                  </span>
                  <p className="text-zinc-700 mt-0.5">{req.authorRequest.topics}</p>
                </div>
                {req.authorRequest.sampleUrl && (
                  <div>
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                      Muestra (URL)
                    </span>
                    <a
                      href={req.authorRequest.sampleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-indigo-600 hover:underline mt-0.5 truncate"
                    >
                      {req.authorRequest.sampleUrl}
                    </a>
                  </div>
                )}
                {req.authorRequest.sampleText && (
                  <div>
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                      Muestra (texto)
                    </span>
                    <p className="text-zinc-700 mt-0.5 whitespace-pre-wrap">
                      {req.authorRequest.sampleText}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => void approve(req.id)}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Aprobar
              </button>
              <button
                type="button"
                onClick={() => void reject(req.id)}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Rechazar
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
