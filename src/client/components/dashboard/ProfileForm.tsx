// ─── ProfileForm — edit user profile ─────────────────────────────────────────
import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Save, Trash2 } from 'lucide-react'
import type { Me } from '../../types'

interface ProfileFormProps {
  initialData: Me
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const navigate = useNavigate()
  const [name, setName] = useState(initialData.name)
  const [bio, setBio] = useState(initialData.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl ?? '')
  const [twitter, setTwitter] = useState(initialData.socialLinks.twitter ?? '')
  const [github, setGithub] = useState(initialData.socialLinks.github ?? '')
  const [website, setWebsite] = useState(initialData.socialLinks.website ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          bio: bio || undefined,
          avatarUrl: avatarUrl || undefined,
          socialLinks: {
            twitter: twitter || undefined,
            github: github || undefined,
            website: website || undefined,
          },
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? 'Error al guardar')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const deleteAccount = async () => {
    if (
      !window.confirm(
        '¿Eliminar tu cuenta? Esta acción es permanente y no se puede deshacer.',
      )
    )
      return
    setDeleting(true)
    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error()
      void navigate({ to: '/' })
    } catch {
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={(e) => void save(e)} className="flex flex-col gap-6 max-w-lg">
      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-16 h-16 rounded-full object-cover border-2 border-zinc-200"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center">
            <span className="text-2xl font-semibold text-zinc-500">
              {name[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
            URL de avatar
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
          Nombre
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
          Biografía
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Cuéntanos sobre ti…"
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Social links */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
          Redes sociales
        </legend>
        {[
          { label: 'Twitter / X', value: twitter, onChange: setTwitter, placeholder: '@usuario' },
          { label: 'GitHub', value: github, onChange: setGithub, placeholder: '@usuario' },
          { label: 'Sitio web', value: website, onChange: setWebsite, placeholder: 'https://…' },
        ].map(({ label, value, onChange, placeholder }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-24 text-xs text-zinc-500 shrink-0">{label}</span>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}
      </fieldset>

      {/* Feedback */}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {saved && <p className="text-sm text-green-600 font-medium">Perfil actualizado.</p>}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>

        <button
          type="button"
          onClick={() => void deleteAccount()}
          disabled={deleting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? 'Eliminando…' : 'Eliminar cuenta'}
        </button>
      </div>
    </form>
  )
}
