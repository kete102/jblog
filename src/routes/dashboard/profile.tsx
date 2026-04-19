import { Hono } from 'hono'
import React from 'react'
import { requireAuth } from '@/middleware/auth'
import { updateUserProfile, deleteUser } from '@/services/users'
import { deleteSession } from '@/lib/session'
import DashboardShell from '@/components/dashboard/DashboardShell'

const router = new Hono()

router.use('*', requireAuth)

// ─── GET /dashboard/profile ───────────────────────────────────────────────────

router.get('/', (c) => {
  const user = c.get('user')!
  const saved = c.req.query('saved') === '1'

  return c.render(
    <DashboardShell user={user} active="profile">
      <div className="p-4 sm:p-8 max-w-xl w-full mx-auto">
        <h1 className="text-xl font-semibold text-zinc-900 mb-6">Perfil</h1>

        {/* Author request status banners */}
        {user.role === 'reader' && (
          <div className="mb-6 px-4 py-4 rounded-lg bg-indigo-50 border border-indigo-200">
            <p className="text-sm font-medium text-indigo-900 mb-0.5">¿Quieres escribir en Destellos de luz?</p>
            <p className="text-sm text-indigo-700 mb-3">
              Comparte tu conocimiento con nuestra comunidad. Solicita ser autor.
            </p>
            <a
              href="/dashboard/become-author"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Solicitar ahora →
            </a>
          </div>
        )}

        {user.role === 'pending' && (
          <div className="mb-6 px-4 py-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm font-medium text-amber-800 mb-0.5">Solicitud en revisión</p>
            <p className="text-sm text-amber-700">
              Tu solicitud de autor está siendo revisada. Tendrás acceso al editor una vez aprobada.
            </p>
          </div>
        )}

        {user.role === 'rejected' && (
          <div className="mb-6 px-4 py-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm font-medium text-red-800 mb-1">Solicitud no aprobada</p>
            {user.rejectedReason ? (
              <p className="text-sm text-red-700 mb-3">{user.rejectedReason}</p>
            ) : (
              <p className="text-sm text-red-700 mb-3">
                Tu solicitud no fue aprobada en este momento.
              </p>
            )}
            <a
              href="/dashboard/become-author"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Volver a solicitar →
            </a>
          </div>
        )}

        {saved && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">
            Perfil guardado.
          </div>
        )}

        <form method="POST" action="/dashboard/profile" className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Nombre visible
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={user.name}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Biografía
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={user.bio ?? ''}
              placeholder="Una breve biografía mostrada en tu página de autor…"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-zinc-700 mb-1.5">
              URL del avatar
            </label>
            <input
              id="avatarUrl"
              name="avatarUrl"
              type="url"
              defaultValue={user.avatarUrl ?? ''}
              placeholder="https://…"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Social links */}
          <div>
            <p className="text-sm font-medium text-zinc-700 mb-3">Redes sociales</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs text-zinc-500 shrink-0">Twitter</span>
                <input
                  name="twitter"
                  type="url"
                  defaultValue={user.socialLinks?.twitter ?? ''}
                  placeholder="https://twitter.com/…"
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs text-zinc-500 shrink-0">GitHub</span>
                <input
                  name="github"
                  type="url"
                  defaultValue={user.socialLinks?.github ?? ''}
                  placeholder="https://github.com/…"
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs text-zinc-500 shrink-0">Website</span>
                <input
                  name="website"
                  type="url"
                  defaultValue={user.socialLinks?.website ?? ''}
                  placeholder="https://…"
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Guardar perfil
            </button>
          </div>
        </form>

        {/* Danger zone */}
        <div className="mt-12 pt-8 border-t border-zinc-200">
          <h2 className="text-sm font-medium text-zinc-900 mb-1">Zona de peligro</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Elimina permanentemente tu cuenta y todas tus publicaciones. Esta acción no se puede deshacer.
          </p>
          <a
            href="/dashboard/profile/delete"
            className="inline-flex items-center px-4 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Eliminar cuenta
          </a>
        </div>
      </div>
    </DashboardShell>,
    { seo: { title: 'Perfil', noIndex: true } },
  )
})

// ─── POST /dashboard/profile ──────────────────────────────────────────────────

router.post('/', async (c) => {
  const user = c.get('user')!
  const body = await c.req.parseBody()

  const name = String(body.name ?? '').trim()
  if (!name) return c.redirect('/dashboard/profile')

  await updateUserProfile(user.id, {
    name,
    bio: String(body.bio ?? '').trim() || null,
    avatarUrl: String(body.avatarUrl ?? '').trim() || null,
    socialLinks: {
      twitter: String(body.twitter ?? '').trim() || undefined,
      github: String(body.github ?? '').trim() || undefined,
      website: String(body.website ?? '').trim() || undefined,
    },
  })

  return c.redirect('/dashboard/profile?saved=1')
})

// ─── GET /dashboard/profile/delete ───────────────────────────────────────────

router.get('/delete', (c) => {
  const user = c.get('user')!

  return c.render(
    <DashboardShell user={user} active="profile">
      <div className="p-4 sm:p-8 max-w-md w-full mx-auto">
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">Eliminar cuenta</h1>
        <p className="text-sm text-zinc-500 mb-8">
          Esto eliminará permanentemente tu cuenta, todas tus publicaciones y todos los datos asociados.
          Esta acción no se puede deshacer.
        </p>

        <div className="rounded-lg border border-red-200 bg-red-50 p-5 space-y-4">
          <p className="text-sm font-medium text-red-700">
            Estás a punto de eliminar la cuenta de <span className="font-semibold">{user.name}</span>.
          </p>

          <div className="flex items-center gap-3">
            <form method="POST" action="/dashboard/profile/delete">
                <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Sí, eliminar mi cuenta
              </button>
            </form>
            <a
              href="/dashboard/profile"
              className="px-4 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancelar
            </a>
          </div>
        </div>
      </div>
    </DashboardShell>,
    { seo: { title: 'Eliminar cuenta', noIndex: true } },
  )
})

// ─── POST /dashboard/profile/delete ──────────────────────────────────────────

router.post('/delete', async (c) => {
  const user = c.get('user')!

  await deleteSession(c)
  await deleteUser(user.id)

  return c.redirect('/')
})

export default router
