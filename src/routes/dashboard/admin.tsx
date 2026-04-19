import { Hono } from 'hono'
import React from 'react'
import { requireAdmin } from '@/middleware/auth'
import { getPendingUsers, approveUser, rejectUser, getUserById } from '@/services/users'
import DashboardShell from '@/components/dashboard/DashboardShell'

const router = new Hono()

router.use('*', requireAdmin)

// ─── GET /dashboard/admin ─────────────────────────────────────────────────────

router.get('/', async (c) => {
  const user = c.get('user')!
  const pending = await getPendingUsers()

  return c.render(
    <DashboardShell user={user} active="admin">
      <div className="p-4 sm:p-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-zinc-900">Solicitudes pendientes</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {pending.length} solicitud{pending.length !== 1 ? 'es' : ''} pendiente{pending.length !== 1 ? 's' : ''} de revisión
          </p>
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-200 rounded-xl">
            <p className="text-zinc-500 text-sm">No hay solicitudes pendientes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((u) => (
              <div key={u.id} className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                {/* User header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-sm font-semibold shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900">{u.name}</p>
                    <p className="text-xs text-zinc-500">{u.email}</p>
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {u.createdAt.toLocaleDateString('es-ES', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Application data */}
                {u.authorRequest ? (
                  <div className="px-5 py-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Biografía</p>
                      <p className="text-sm text-zinc-700 leading-relaxed">{u.authorRequest.bio}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Temas</p>
                      <p className="text-sm text-zinc-700">{u.authorRequest.topics}</p>
                    </div>
                    {u.authorRequest.sampleUrl && (
                      <div>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Muestra de escritura</p>
                        <a
                          href={u.authorRequest.sampleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:underline break-all"
                        >
                          {u.authorRequest.sampleUrl}
                        </a>
                      </div>
                    )}
                    {u.authorRequest.sampleText && (
                      <div>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Muestra de escritura (texto)</p>
                        <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap line-clamp-6">
                          {u.authorRequest.sampleText}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-5 py-4">
                    <p className="text-sm text-zinc-400 italic">No se enviaron datos de solicitud.</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 px-5 py-3 border-t border-zinc-100 bg-zinc-50">
                  <form method="POST" action={`/dashboard/admin/approve/${u.id}`}>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                    >
                      Aprobar
                    </button>
                  </form>
                  <a
                    href={`/dashboard/admin/reject/${u.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Rechazar
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>,
    { seo: { title: 'Administración', noIndex: true } },
  )
})

// ─── POST /dashboard/admin/approve/:id ───────────────────────────────────────

router.post('/approve/:id', async (c) => {
  await approveUser(c.req.param('id'))
  return c.redirect('/dashboard/admin')
})

// ─── GET /dashboard/admin/reject/:id ─────────────────────────────────────────

router.get('/reject/:id', async (c) => {
  const admin = c.get('user')!
  const target = await getUserById(c.req.param('id'))
  if (!target) return c.notFound()

  return c.render(
    <DashboardShell user={admin} active="admin">
      <div className="p-4 sm:p-8 max-w-md">
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">Rechazar solicitud de autor</h1>
        <p className="text-sm text-zinc-500 mb-8">
          Opcionalmente, proporciona comentarios. El usuario los verá al volver a solicitar.
        </p>

        <div className="flex items-center gap-2.5 mb-6">
          {target.avatarUrl ? (
            <img src={target.avatarUrl} alt={target.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-sm font-semibold shrink-0">
              {target.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-zinc-900">{target.name}</p>
            <p className="text-xs text-zinc-500">{target.email}</p>
          </div>
        </div>

        <form method="POST" action={`/dashboard/admin/reject/${target.id}`} className="space-y-4">
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Comentarios <span className="text-zinc-400 font-normal">(opcional)</span>
            </label>
            <textarea
              id="reason"
              name="reason"
              rows={3}
              placeholder="p. ej. Por favor añade más detalle a tu biografía e incluye una muestra de escritura antes de volver a solicitar."
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Confirmar rechazo
            </button>
            <a
              href="/dashboard/admin"
              className="px-4 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancelar
            </a>
          </div>
        </form>
      </div>
    </DashboardShell>,
    { seo: { title: 'Rechazar solicitud', noIndex: true } },
  )
})

// ─── POST /dashboard/admin/reject/:id ────────────────────────────────────────

router.post('/reject/:id', async (c) => {
  const body = await c.req.parseBody()
  await rejectUser(c.req.param('id'), String(body.reason ?? ''))
  return c.redirect('/dashboard/admin')
})

export default router
