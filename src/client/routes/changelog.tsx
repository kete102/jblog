import React, { useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { marked } from 'marked'
import { changelogOptions } from '../lib/api'
import { usePageTitle } from '../lib/usePageTitle'

// Configure marked — use synchronous renderer, sanitise nothing (we own the MD)
marked.setOptions({ async: false })

// ─── Changelog page ───────────────────────────────────────────────────────────

export const Route = createFileRoute('/changelog')({
  loader: ({ context }) => context.queryClient.ensureQueryData(changelogOptions),
  component: ChangelogPage,
})

function ChangelogPage() {
  const { data, isLoading, isError } = useQuery(changelogOptions)
  usePageTitle('Changelog')

  const html = useMemo(() => {
    if (!data?.markdown) return ''
    return marked.parse(data.markdown) as string
  }, [data?.markdown])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-base-content/50 text-sm">Cargando changelog…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-error text-sm">No se pudo cargar el changelog.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-base-content mb-8">Changelog</h1>
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
