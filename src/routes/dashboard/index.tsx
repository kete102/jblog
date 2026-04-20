import { Hono } from 'hono'
import React from 'react'
import { requireAuthor } from '@/middleware/auth'
import { getAuthorPosts } from '@/services/posts'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { PlusIcon } from '@/components/icons'
import { formatDate } from '@/lib/format'

const router = new Hono()

// Inline script — wires up the delete confirmation <dialog>.
// Each "Eliminar" button carries data-post-id and data-post-title;
// clicking one sets the form action and opens the modal.
const deleteModalScript = /* js */`(function () {
  var modal   = document.getElementById('delete-modal');
  var form    = document.getElementById('delete-modal-form');
  var titleEl = document.getElementById('delete-modal-title');
  var cancel  = document.getElementById('delete-modal-cancel');
  if (!modal || !form || !cancel) return;

  document.querySelectorAll('[data-delete-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      form.action = '/dashboard/post/' + btn.dataset.postId + '/delete';
      if (titleEl) titleEl.textContent = '\u201C' + btn.dataset.postTitle + '\u201D';
      modal.showModal();
    });
  });

  cancel.addEventListener('click', function () { modal.close(); });

  // Close when clicking the backdrop (outside the dialog box)
  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.close();
  });
})();`

// ─── GET /dashboard ───────────────────────────────────────────────────────────

router.get('/', requireAuthor, async (c) => {
  const user = c.get('user')!
  const posts = await getAuthorPosts(user.id)

  return c.render(
    <DashboardShell user={user} active="posts">
      <div className="p-4 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Publicaciones</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {posts.length} {posts.length === 1 ? 'publicación' : 'publicaciones'}
            </p>
          </div>
          <a
            href="/dashboard/post/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Nueva publicación
          </a>
        </div>

        {/* Posts list */}
        {posts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-200 rounded-xl">
            <p className="text-zinc-500 text-sm">Aún no hay publicaciones.</p>
            <a
              href="/dashboard/post/new"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Escribe tu primera publicación →
            </a>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="border border-zinc-200 rounded-xl p-4 bg-white">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="font-medium text-zinc-900 leading-snug">{post.title}</div>
                    <span
                      className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {post.status === 'published' ? 'publicado' : 'borrador'}
                    </span>
                  </div>
                  {post.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-2">
                      {post.tags.map((tag) => (
                        <span key={tag.id} className="text-xs text-zinc-400">
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-zinc-400 mb-3">
                    {post.views.toLocaleString()} vistas · {post.likes.toLocaleString()} me gusta · {formatDate(post.updatedAt, 'short')}
                  </p>
                  <div className="flex items-center gap-1">
                    <a
                      href={`/dashboard/post/${post.id}/edit`}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                    >
                      Editar
                    </a>
                    <form method="POST" action={`/dashboard/post/${post.id}/publish`}>
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                      >
                        {post.status === 'published' ? 'Despublicar' : 'Publicar'}
                      </button>
                    </form>
                    <button
                      type="button"
                      data-delete-btn
                      data-post-id={post.id}
                      data-post-title={post.title}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block border border-zinc-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Título</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 w-24">Estado</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 w-20">Vistas</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 w-20">Me gusta</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500 w-32">Actualizado</th>
                    <th className="px-4 py-3 w-32" />
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post, i) => (
                    <tr
                      key={post.id}
                      className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors ${i % 2 === 0 ? '' : 'bg-zinc-50/50'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900 truncate max-w-xs">{post.title}</div>
                        {post.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {post.tags.map((tag) => (
                              <span key={tag.id} className="text-xs text-zinc-400">
                                #{tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            post.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {post.status === 'published' ? 'publicado' : 'borrador'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{post.views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-zinc-500">{post.likes.toLocaleString()}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{formatDate(post.updatedAt, 'short')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`/dashboard/post/${post.id}/edit`}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                          >
                            Editar
                          </a>
                          <form method="POST" action={`/dashboard/post/${post.id}/publish`}>
                            <button
                              type="submit"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                            >
                              {post.status === 'published' ? 'Despublicar' : 'Publicar'}
                            </button>
                          </form>
                          <button
                              type="button"
                              data-delete-btn
                              data-post-id={post.id}
                              data-post-title={post.title}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                            >
                              Eliminar
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Delete confirmation modal ───────────────────────────────────────── */}
      <dialog
        id="delete-modal"
        className="rounded-2xl shadow-2xl border border-zinc-200 p-0 w-full max-w-sm"
      >
        <div className="p-6">
          <h3 className="text-base font-semibold text-zinc-900 mb-1">
            ¿Eliminar esta publicación?
          </h3>
          <p className="text-sm text-zinc-500 mb-1">Esta acción no se puede deshacer.</p>
          <p id="delete-modal-title" className="text-sm font-medium text-zinc-800 mb-6 truncate" />
          <div className="flex justify-end gap-2">
            <button
              id="delete-modal-cancel"
              type="button"
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              Cancelar
            </button>
            <form id="delete-modal-form" method="POST">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </form>
          </div>
        </div>
      </dialog>

      <script dangerouslySetInnerHTML={{ __html: deleteModalScript }} />
    </DashboardShell>,
    { seo: { title: 'Dashboard', noIndex: true } },
  )
})

export default router
