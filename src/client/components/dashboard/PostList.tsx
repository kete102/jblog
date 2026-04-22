// ─── PostList — dashboard list of the author's posts ─────────────────────────
import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Eye, EyeOff, Pencil, Trash2, Plus } from 'lucide-react'
import { formatDate, formatNumber } from '../../lib/format'
import type { DashboardPost } from '../../types'

interface PostListProps {
  initialPosts: DashboardPost[]
}

export function PostList({ initialPosts }: PostListProps) {
  const [posts, setPosts] = useState<DashboardPost[]>(initialPosts)
  const [busy, setBusy] = useState<string | null>(null) // post id being mutated

  const togglePublish = async (post: DashboardPost) => {
    if (busy) return
    setBusy(post.id)
    try {
      const res = await fetch(`/api/dashboard/posts/${post.id}/publish`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { ok: boolean; status: 'draft' | 'published' }
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: data.status } : p)))
    } catch {
      // Silently fail — no toast system yet
    } finally {
      setBusy(null)
    }
  }

  const deletePost = async (post: DashboardPost) => {
    if (!window.confirm(`¿Eliminar "${post.title}"?`)) return
    if (busy) return
    setBusy(post.id)
    try {
      const res = await fetch(`/api/dashboard/posts/${post.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error()
      setPosts((prev) => prev.filter((p) => p.id !== post.id))
    } catch {
      // Silently fail — no toast system yet
    } finally {
      setBusy(null)
    }
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-base-content/60">
        <p className="mb-4">Todavía no has publicado ningún artículo.</p>
        <Link
          to="/dashboard/post/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-content text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo artículo
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => {
        const isBusy = busy === post.id
        const isPublished = post.status === 'published'

        return (
          <div
            key={post.id}
            className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-base-300 bg-base-100 hover:shadow-sm transition-shadow"
          >
            {/* Cover thumbnail */}
            {post.coverImageUrl && (
              <img
                src={post.coverImageUrl}
                alt=""
                className="w-full sm:w-16 h-12 object-cover rounded-lg shrink-0"
              />
            )}

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isPublished ? 'bg-green-100 text-green-700' : 'bg-base-200 text-base-content/70'
                  }`}
                >
                  {isPublished ? 'Publicado' : 'Borrador'}
                </span>
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-0.5 rounded-full text-xs bg-base-200 text-base-content/70"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-sm font-semibold text-base-content truncate">{post.title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-base-content/50">
                <span>{formatDate(post.updatedAt, 'short')}</span>
                <span>{formatNumber(post.views)} vistas</span>
                <span>{formatNumber(post.likes)} likes</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => void togglePublish(post)}
                disabled={isBusy}
                title={isPublished ? 'Volver a borrador' : 'Publicar'}
                className="p-2 rounded-lg text-base-content/50 hover:text-base-content/80 hover:bg-base-200 transition-colors disabled:opacity-50"
              >
                {isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <Link
                to="/dashboard/post/$id/edit"
                params={{ id: post.id }}
                className="p-2 rounded-lg text-base-content/50 hover:text-base-content/80 hover:bg-base-200 transition-colors"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => void deletePost(post)}
                disabled={isBusy}
                title="Eliminar"
                className="p-2 rounded-lg text-base-content/50 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
