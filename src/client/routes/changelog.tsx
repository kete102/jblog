import React, { useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { marked } from 'marked'
import { changelogOptions } from '../lib/api'

// Configure marked — use synchronous renderer, sanitise nothing (we own the MD)
marked.setOptions({ async: false })

// ─── Changelog page ───────────────────────────────────────────────────────────

export const Route = createFileRoute('/changelog')({
  loader: ({ context }) => context.queryClient.ensureQueryData(changelogOptions),
  component: ChangelogPage,
})

function ChangelogPage() {
  const { data, isLoading, isError } = useQuery(changelogOptions)

  const html = useMemo(() => {
    if (!data?.markdown) return ''
    return marked.parse(data.markdown) as string
  }, [data?.markdown])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Cargando changelog…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-sm">No se pudo cargar el changelog.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-zinc-900 mb-8">Changelog</h1>
      <div
        className="prose prose-zinc max-w-none"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
