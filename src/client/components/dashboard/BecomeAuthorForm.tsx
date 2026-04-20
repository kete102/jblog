// ─── BecomeAuthorForm — request author status ─────────────────────────────────
import React, { useState } from 'react'
import { Send } from 'lucide-react'
import type { BecomeAuthorData } from '../../types'

interface BecomeAuthorFormProps {
  initialData: BecomeAuthorData
}

export function BecomeAuthorForm({ initialData }: BecomeAuthorFormProps) {
  const existing = initialData.authorRequest
  const rejected = initialData.rejectedReason

  const [bio, setBio] = useState(existing?.bio ?? '')
  const [topics, setTopics] = useState(existing?.topics ?? '')
  const [sampleUrl, setSampleUrl] = useState(existing?.sampleUrl ?? '')
  const [sampleText, setSampleText] = useState(existing?.sampleText ?? '')
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/become-author', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bio,
          topics,
          sampleUrl: sampleUrl || undefined,
          sampleText: sampleText || undefined,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? 'Error al enviar')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setSending(false)
    }
  }

  if (submitted) {
    return (
      <div className="p-6 rounded-xl border border-green-200 bg-green-50 text-green-800">
        <p className="font-medium">¡Solicitud enviada!</p>
        <p className="text-sm mt-1">
          Revisaremos tu solicitud y te notificaremos lo antes posible.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      {/* Rejection notice */}
      {rejected && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800">
          <p className="font-medium">Tu solicitud anterior fue rechazada.</p>
          {rejected && <p className="mt-1">Motivo: {rejected}</p>}
          <p className="mt-1">Puedes volver a solicitar con la información actualizada.</p>
        </div>
      )}

      {/* Pending notice */}
      {existing && !rejected && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-800">
          <p className="font-medium">Tu solicitud está pendiente de revisión.</p>
          <p className="mt-1">Puedes actualizar la información a continuación.</p>
        </div>
      )}

      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
        {/* Bio */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
            Biografía <span className="text-red-500">*</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
            placeholder="Cuéntanos quién eres y por qué quieres ser autor…"
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Topics */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
            Temáticas que abordarías <span className="text-red-500">*</span>
          </label>
          <textarea
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            required
            placeholder="p.ej. programación, diseño, productividad…"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Sample URL */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
            URL de muestra (opcional)
          </label>
          <input
            type="url"
            value={sampleUrl}
            onChange={(e) => setSampleUrl(e.target.value)}
            placeholder="https://… artículo o portfolio"
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Sample text */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
            Texto de muestra (opcional)
          </label>
          <textarea
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            placeholder="Pega aquí un extracto de algún artículo que hayas escrito…"
            rows={5}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 self-start"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Enviando…' : existing ? 'Actualizar solicitud' : 'Enviar solicitud'}
        </button>
      </form>
    </div>
  )
}
