// ─── CommentSection — threaded comments + submission form ────────────────────
import React, { useState } from 'react'
import { Reply, Pencil, Trash2, Send } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { formatDate } from '../lib/format'
import { cn } from '../lib/cn'
import type { CommentThread, CommentWithUser, Me } from '../types'

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiPut(path: string, body: unknown): Promise<void> {
  const res = await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error((json as { error?: string }).error ?? 'Error')
  }
}

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(path, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error((json as { error?: string }).error ?? 'Error')
  }
}

// ─── Shared class fragments ───────────────────────────────────────────────────

const actionBtnClass = cn(
  'inline-flex items-center gap-1 px-2 py-1 rounded text-xs',
  'text-base-content/50 hover:text-base-content/80 hover:bg-base-200 transition-colors',
)

const cancelBtnClass = cn(
  'px-3 py-1.5 rounded-lg text-sm',
  'text-base-content/60 hover:text-base-content/80 hover:bg-base-200 transition-colors',
)

const submitBtnClass = cn(
  'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium',
  'bg-primary text-primary-content hover:bg-primary/90 transition-colors disabled:opacity-50',
)

const textareaClass = cn(
  'w-full px-3 py-2 rounded-lg border border-base-300 bg-base-100',
  'text-sm text-base-content placeholder-base-content/40',
  'focus:outline-none focus:ring-2 focus:ring-primary resize-none',
)

// ─── Avatar helper ────────────────────────────────────────────────────────────

function Avatar({ user }: { user: CommentWithUser['user'] }) {
  return user.avatarUrl ? (
    <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center shrink-0">
      <span className="text-sm font-medium text-base-content/60">{user.name[0]?.toUpperCase()}</span>
    </div>
  )
}

// ─── CommentForm ──────────────────────────────────────────────────────────────

interface CommentFormProps {
  postSlug: string
  parentId?: string | null
  initialValue?: string
  placeholder?: string
  submitLabel?: string
  onSuccess: (comment: CommentWithUser) => void
  onCancel?: () => void
}

function CommentForm({
  postSlug,
  parentId,
  initialValue = '',
  placeholder = 'Escribe un comentario…',
  submitLabel = 'Comentar',
  onSuccess,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    const trimmed = content.trim()
    if (!trimmed) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ postSlug, content: trimmed, parentId: parentId ?? null }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? 'Error al enviar')
      }
      const optimistic: CommentWithUser = {
        id: crypto.randomUUID(),
        postId: '',
        userId: '',
        parentId: parentId ?? null,
        content: trimmed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: { name: 'Tú', avatarUrl: null },
      }
      setContent('')
      onSuccess(optimistic)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={textareaClass}
      />
      {error && <p className="text-xs text-error">{error}</p>}
      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className={cancelBtnClass}>
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={sending || !content.trim()}
          className={submitBtnClass}
        >
          <Send className="w-3.5 h-3.5" />
          {sending ? 'Enviando…' : submitLabel}
        </button>
      </div>
    </div>
  )
}

// ─── EditCommentForm ──────────────────────────────────────────────────────────

interface EditCommentFormProps {
  comment: CommentWithUser
  onSave: (updated: CommentWithUser) => void
  onCancel: () => void
}

function EditCommentForm({ comment, onSave, onCancel }: EditCommentFormProps) {
  const [content, setContent] = useState(comment.content)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    const trimmed = content.trim()
    if (!trimmed) return
    setSaving(true)
    setError(null)
    try {
      await apiPut(`/api/comments/${comment.id}`, { content: trimmed })
      onSave({ ...comment, content: trimmed, updatedAt: new Date().toISOString() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 mt-1">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        autoFocus
        className={textareaClass}
      />
      {error && <p className="text-xs text-error">{error}</p>}
      <div className="flex items-center gap-2 justify-end">
        <button type="button" onClick={onCancel} className={cancelBtnClass}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || !content.trim()}
          className={cn(submitBtnClass, 'gap-0')}
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ─── SingleComment ────────────────────────────────────────────────────────────

interface SingleCommentProps {
  comment: CommentWithUser
  me: Me | null
  postSlug: string
  onReply?: (c: CommentWithUser) => void
  onEdit: (updated: CommentWithUser) => void
  onDelete: (id: string) => void
  isReply?: boolean
}

function SingleComment({
  comment,
  me,
  postSlug,
  onReply,
  onEdit,
  onDelete,
  isReply,
}: SingleCommentProps) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)

  const canEdit = me && me.id === comment.userId
  const canDelete = me && (me.id === comment.userId || me.role === 'admin')

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este comentario?')) return
    setDeleting(true)
    try {
      await apiDelete(`/api/comments/${comment.id}`)
      onDelete(comment.id)
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className={cn('flex gap-3', isReply && 'pl-10')}>
      <Avatar user={comment.user} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-base-content">{comment.user.name}</span>
          <span className="text-xs text-base-content/50">{formatDate(comment.createdAt, 'short')}</span>
          {comment.updatedAt !== comment.createdAt && (
            <span className="text-xs text-base-content/50">(editado)</span>
          )}
        </div>

        {editing ? (
          <EditCommentForm
            comment={comment}
            onSave={(updated) => { onEdit(updated); setEditing(false) }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <p className="text-sm text-base-content/80 mt-0.5 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}

        {/* Actions */}
        {!editing && (
          <div className="flex items-center gap-1 mt-1.5 -ml-1">
            {!isReply && onReply && me && (
              <button
                type="button"
                onClick={() => setReplyOpen((o) => !o)}
                className={actionBtnClass}
              >
                <Reply className="w-3.5 h-3.5" />
                Responder
              </button>
            )}
            {canEdit && (
              <button type="button" onClick={() => setEditing(true)} className={actionBtnClass}>
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                  'text-base-content/50 hover:text-red-600 hover:bg-red-50 disabled:opacity-50',
                )}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            )}
          </div>
        )}

        {/* Inline reply form */}
        <AnimatePresence>
          {replyOpen && (
            <motion.div
              key="reply-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="overflow-hidden mt-3"
            >
              <CommentForm
                postSlug={postSlug}
                parentId={comment.id}
                placeholder="Escribe una respuesta…"
                submitLabel="Responder"
                onSuccess={(reply) => { onReply?.(reply); setReplyOpen(false) }}
                onCancel={() => setReplyOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── CommentSection ───────────────────────────────────────────────────────────

interface CommentSectionProps {
  postSlug: string
  initialThreads: CommentThread[]
  me: Me | null
}

export function CommentSection({ postSlug, initialThreads, me }: CommentSectionProps) {
  const [threads, setThreads] = useState<CommentThread[]>(initialThreads)

  const addTopLevel = (comment: CommentWithUser) =>
    setThreads((prev) => [{ comment, replies: [] }, ...prev])

  const addReply = (reply: CommentWithUser) =>
    setThreads((prev) =>
      prev.map((t) =>
        t.comment.id === reply.parentId ? { ...t, replies: [...t.replies, reply] } : t,
      ),
    )

  const editComment = (updated: CommentWithUser) =>
    setThreads((prev) =>
      prev.map((t) => {
        if (t.comment.id === updated.id) return { ...t, comment: updated }
        return { ...t, replies: t.replies.map((r) => (r.id === updated.id ? updated : r)) }
      }),
    )

  const deleteComment = (id: string) =>
    setThreads((prev) =>
      prev
        .filter((t) => t.comment.id !== id)
        .map((t) => ({ ...t, replies: t.replies.filter((r) => r.id !== id) })),
    )

  const total = threads.reduce((n, t) => n + 1 + t.replies.length, 0)

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-base-content mb-6">
        {total > 0 ? `${total} comentario${total === 1 ? '' : 's'}` : 'Comentarios'}
      </h2>

      {/* New comment form */}
      {me ? (
        <div className="flex gap-3 mb-8">
          <Avatar user={{ name: me.name, avatarUrl: me.avatarUrl }} />
          <div className="flex-1">
            <CommentForm postSlug={postSlug} onSuccess={addTopLevel} />
          </div>
        </div>
      ) : (
        <div className="mb-8 p-4 rounded-xl border border-base-300 bg-base-100 text-sm text-base-content/70">
          <a href="/auth/google" className="text-primary font-medium hover:underline">
            Inicia sesión
          </a>{' '}
          para dejar un comentario.
        </div>
      )}

      {/* Thread list */}
      {threads.length === 0 ? (
        <p className="text-sm text-base-content/50">Sé el primero en comentar.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {threads.map((thread) => (
            <div key={thread.comment.id} className="flex flex-col gap-4">
              <SingleComment
                comment={thread.comment}
                me={me}
                postSlug={postSlug}
                onReply={addReply}
                onEdit={editComment}
                onDelete={deleteComment}
              />
              {thread.replies.map((reply) => (
                <SingleComment
                  key={reply.id}
                  comment={reply}
                  me={me}
                  postSlug={postSlug}
                  onEdit={editComment}
                  onDelete={deleteComment}
                  isReply
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
