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
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-zinc-900">Pending approvals</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {pending.length} user{pending.length !== 1 ? 's' : ''} awaiting approval
          </p>
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-200 rounded-xl">
            <p className="text-zinc-500 text-sm">No pending users.</p>
          </div>
        ) : (
          <div className="border border-zinc-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="text-left px-4 py-3 font-medium text-zinc-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-500 w-36">Joined</th>
                  <th className="px-4 py-3 w-40" />
                </tr>
              </thead>
              <tbody>
                {pending.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-xs font-semibold shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-zinc-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{u.email}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {u.createdAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <form method="POST" action={`/dashboard/admin/approve/${u.id}`}>
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                          >
                            Approve
                          </button>
                        </form>
                        <a
                          href={`/dashboard/admin/reject/${u.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          Reject
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>,
    { seo: { title: 'Admin', noIndex: true } },
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
      <div className="p-8 max-w-md">
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">Reject author request</h1>
        <p className="text-sm text-zinc-500 mb-8">
          Optionally provide a reason. The user will see it on their profile page.
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
              Reason <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="reason"
              name="reason"
              rows={3}
              placeholder="e.g. Profile incomplete, please add a bio and avatar before re-applying."
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Confirm rejection
            </button>
            <a
              href="/dashboard/admin"
              className="px-4 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </DashboardShell>,
    { seo: { title: 'Reject request', noIndex: true } },
  )
})

// ─── POST /dashboard/admin/reject/:id ────────────────────────────────────────

router.post('/reject/:id', async (c) => {
  const body = await c.req.parseBody()
  await rejectUser(c.req.param('id'), String(body.reason ?? ''))
  return c.redirect('/dashboard/admin')
})

export default router
