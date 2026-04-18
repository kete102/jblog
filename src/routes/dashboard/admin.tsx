import { Hono } from 'hono'
import React from 'react'
import { requireAdmin } from '@/middleware/auth'
import { getPendingUsers, approveUser, rejectUser } from '@/services/users'
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
                        <form method="POST" action={`/dashboard/admin/reject/${u.id}`}>
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        </form>
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

// ─── POST /dashboard/admin/reject/:id ────────────────────────────────────────

router.post('/reject/:id', async (c) => {
  await rejectUser(c.req.param('id'))
  return c.redirect('/dashboard/admin')
})

export default router
