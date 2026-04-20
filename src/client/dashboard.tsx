/* @jsxImportSource hono/jsx/dom */
/**
 * Client-side dashboard bundle.
 * Renders post cards with publish/unpublish and delete actions into #dashboard-root.
 * Initial data is read from <script id="dashboard-data" type="application/json">.
 */
import { useState, useCallback, useRef, useEffect, render } from 'hono/jsx/dom'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tag {
  id: string
  name: string
  slug: string
}

interface PostData {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImageUrl: string | null
  status: 'draft' | 'published'
  views: number
  likes: number
  updatedAt: string // ISO string (Date serialised to JSON)
  tags: Tag[]
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  )
}

// ─── XHR helper ───────────────────────────────────────────────────────────────

async function xhrPost(url: string): Promise<{ ok: boolean; status?: string; message?: string }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'x-requested-with': 'xmlhttprequest' },
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    return { ok: false, message: (json as { message?: string }).message ?? 'Error' }
  }
  return res.json() as Promise<{ ok: boolean; status?: string }>
}

// ─── Delete modal ─────────────────────────────────────────────────────────────

interface DeleteModalProps {
  title: string
  onConfirm: () => void
  onCancel: () => void
  busy: boolean
}

function DeleteModal({ title, onConfirm, onCancel, busy }: DeleteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    el.showModal()
    const onClose = () => onCancel()
    el.addEventListener('close', onClose)
    return () => el.removeEventListener('close', onClose)
  }, [])

  const handleBackdropClick = useCallback((e: MouseEvent) => {
    if (e.target === dialogRef.current) onCancel()
  }, [onCancel])

  return (
    <dialog
      ref={dialogRef}
      class="rounded-2xl shadow-2xl border border-zinc-200 p-0 w-full max-w-sm"
      onClick={handleBackdropClick}
    >
      <div class="p-6">
        <h3 class="text-base font-semibold text-zinc-900 mb-1">
          ¿Eliminar esta publicación?
        </h3>
        <p class="text-sm text-zinc-500 mb-1">Esta acción no se puede deshacer.</p>
        <p class="text-sm font-medium text-zinc-800 mb-6 truncate">"{title}"</p>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            class="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            class="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {busy ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </dialog>
  )
}

// ─── Three-dot context menu ───────────────────────────────────────────────────

interface ThreeDotMenuProps {
  post: PostData
  onPublishToggle: (id: string) => void
  onDeleteRequest: (post: PostData) => void
  busy: boolean
}

function ThreeDotMenu({ post, onPublishToggle, onDeleteRequest, busy }: ThreeDotMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={containerRef} class="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-50"
        aria-label="Opciones"
      >
        <DotsIcon />
      </button>

      {open && (
        <div class="absolute right-0 top-full mt-1 z-20 w-44 bg-white rounded-xl border border-zinc-200 shadow-lg overflow-hidden">
          <a
            href={`/dashboard/post/${post.id}/edit`}
            class="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            onClick={() => setOpen(false)}
          >
            Editar
          </a>
          <button
            type="button"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            onClick={() => { setOpen(false); onPublishToggle(post.id) }}
          >
            {post.status === 'published' ? 'Despublicar' : 'Publicar'}
          </button>
          <div class="border-t border-zinc-100" />
          <button
            type="button"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => { setOpen(false); onDeleteRequest(post) }}
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Post card ────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: PostData
  onPublishToggle: (id: string) => void
  onDeleteRequest: (post: PostData) => void
  busy: boolean
}

function PostCard({ post, onPublishToggle, onDeleteRequest, busy }: PostCardProps) {
  const published = post.status === 'published'

  return (
    <article class="group relative flex flex-col rounded-xl overflow-hidden border border-zinc-100 hover:border-zinc-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-white">
      {/* Cover image */}
      {post.coverImageUrl ? (
        <div class="relative overflow-hidden bg-zinc-100 aspect-video">
          <img
            src={post.coverImageUrl}
            alt={post.title}
            loading="lazy"
            class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div class="bg-gradient-to-br from-indigo-50 to-violet-50 aspect-video flex items-center justify-center">
          <span class="text-4xl opacity-20">✍️</span>
        </div>
      )}

      {/* Content */}
      <div class="flex flex-col flex-1 p-5">
        {/* Tags + status badge */}
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500"
              >
                #{tag.name}
              </span>
            ))}
          </div>
          <span
            class={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              published ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
            }`}
          >
            {published ? 'publicado' : 'borrador'}
          </span>
        </div>

        {/* Title */}
        <h2 class="font-semibold text-zinc-900 leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
          <a href={`/dashboard/post/${post.id}/edit`} class="stretched-link">
            {post.title}
          </a>
        </h2>

        {post.excerpt && (
          <p class="text-zinc-500 text-sm leading-relaxed line-clamp-2 mb-4">
            {post.excerpt}
          </p>
        )}

        {/* Meta + context menu */}
        <div class="flex items-center justify-between gap-2 mt-auto pt-4 border-t border-zinc-50 flex-wrap">
          <div class="flex items-center gap-3 text-xs text-zinc-400">
            <span class="flex items-center gap-1">
              <EyeIcon />
              {formatNumber(post.views)}
            </span>
            <span class="flex items-center gap-1">
              <HeartIcon />
              {formatNumber(post.likes)}
            </span>
            <span>{formatDate(post.updatedAt)}</span>
          </div>

          <div class="relative z-[2]">
            <ThreeDotMenu
              post={post}
              onPublishToggle={onPublishToggle}
              onDeleteRequest={onDeleteRequest}
              busy={busy}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div class="text-center py-16 border border-dashed border-zinc-200 rounded-xl">
      <p class="text-zinc-500 text-sm">Aún no hay publicaciones.</p>
      <a
        href="/dashboard/post/new"
        class="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        Escribe tu primera publicación →
      </a>
    </div>
  )
}

// ─── Root app ─────────────────────────────────────────────────────────────────

function App({ initialPosts }: { initialPosts: PostData[] }) {
  const [posts, setPosts] = useState<PostData[]>(initialPosts)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PostData | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const handlePublishToggle = useCallback(async (id: string) => {
    setBusyId(id)
    try {
      const result = await xhrPost(`/dashboard/post/${id}/publish`)
      if (result.ok && result.status) {
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: result.status as 'draft' | 'published' } : p)),
        )
      }
    } finally {
      setBusyId(null)
    }
  }, [])

  const handleDeleteRequest = useCallback((post: PostData) => {
    setDeleteTarget(post)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    setDeleteBusy(true)
    try {
      const result = await xhrPost(`/dashboard/post/${deleteTarget.id}/delete`)
      if (result.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
        setDeleteTarget(null)
      }
    } finally {
      setDeleteBusy(false)
    }
  }, [deleteTarget])

  const handleDeleteCancel = useCallback(() => {
    if (!deleteBusy) setDeleteTarget(null)
  }, [deleteBusy])

  return (
    <>
      {posts.length === 0 ? (
        <EmptyState />
      ) : (
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPublishToggle={handlePublishToggle}
              onDeleteRequest={handleDeleteRequest}
              busy={busyId === post.id}
            />
          ))}
        </div>
      )}

      {deleteTarget && (
        <DeleteModal
          title={deleteTarget.title}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          busy={deleteBusy}
        />
      )}
    </>
  )
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

function readDashboardData(): PostData[] {
  const el = document.getElementById('dashboard-data')
  if (!el) return []
  try {
    return JSON.parse(el.textContent ?? '[]') as PostData[]
  } catch {
    return []
  }
}

const root = document.getElementById('dashboard-root')
if (root) {
  const posts = readDashboardData()
  render(<App initialPosts={posts} />, root)
}
