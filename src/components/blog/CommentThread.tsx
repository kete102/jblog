import React from 'react'
import Avatar from '@/components/blog/Avatar'
import { formatDate } from '@/lib/format'
import type { CommentWithUser, CommentThread } from '@/services/engagement'
import type { User } from '@/db/schema'

// ─── Single comment row ───────────────────────────────────────────────────────

export function CommentRow({
  comment,
  slug,
  currentUser,
  isReply = false,
  showReplyBtn = true,
}: {
  comment: CommentWithUser
  slug: string
  currentUser: User | null
  isReply?: boolean
  showReplyBtn?: boolean
}) {
  const isOwner = currentUser?.id === comment.userId
  const edited = comment.updatedAt.getTime() - comment.createdAt.getTime() > 2000

  return (
    <div className="flex gap-3">
      <Avatar
        name={comment.user.name}
        avatarUrl={comment.user.avatarUrl}
        size={isReply ? 'md' : 'lg'}
      />
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 mb-1">
          <span className="text-sm font-semibold text-zinc-900">{comment.user.name}</span>
          <time className="text-xs text-zinc-400">{formatDate(comment.createdAt)}</time>
          {edited && <span className="text-xs text-zinc-400">(edited)</span>}
        </div>

        {/* Content (shown normally) */}
        <p
          id={`comment-content-${comment.id}`}
          className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap break-words"
        >
          {comment.content}
        </p>

        {/* Edit form (hidden by default) */}
        {isOwner && (
          <form
            id={`edit-form-${comment.id}`}
            method="POST"
            action={`/post/${slug}/comment/${comment.id}/edit`}
            className="hidden mt-2"
          >
            <textarea
              name="content"
              defaultValue={comment.content}
              required
              minLength={3}
              maxLength={1000}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                data-edit-cancel={comment.id}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Actions — only render when there's something to show */}
        {(!isReply || isOwner) && (
          <div id={`comment-actions-${comment.id}`} className="flex items-center gap-3 mt-2">
            {/* Reply button — only on top-level, only for logged-in users */}
            {!isReply && showReplyBtn && currentUser && (
              <button
                type="button"
                data-reply-btn={comment.id}
                className="text-xs text-zinc-400 hover:text-indigo-600 transition-colors"
              >
                Reply
              </button>
            )}

            {/* Owner actions */}
            {isOwner && (
              <>
                <button
                  type="button"
                  data-edit-btn={comment.id}
                  className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  Edit
                </button>
                <form
                  method="POST"
                  action={`/post/${slug}/comment/${comment.id}/delete`}
                  onSubmit="return confirm('Delete this comment?')"
                  className="inline"
                >
                  <button
                    type="submit"
                    className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* Inline reply form (hidden by default) */}
        {!isReply && currentUser && (
          <form
            id={`reply-form-${comment.id}`}
            method="POST"
            action={`/post/${slug}/comment`}
            className="hidden mt-4"
          >
            <input type="hidden" name="parentId" value={comment.id} />
            <div className="flex gap-2.5">
              <Avatar
                name={currentUser.name}
                avatarUrl={currentUser.avatarUrl ?? null}
                size="md"
              />
              <div className="flex-1">
                <textarea
                  name="content"
                  required
                  minLength={3}
                  maxLength={1000}
                  rows={2}
                  placeholder={`Reply to ${comment.user.name}…`}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Reply
                  </button>
                  <button
                    type="button"
                    data-reply-cancel={comment.id}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Comment thread (top-level comment + its replies) ─────────────────────────

export function CommentThreadItem({
  thread,
  slug,
  currentUser,
}: {
  thread: CommentThread
  slug: string
  currentUser: User | null
}) {
  return (
    <div>
      <CommentRow
        comment={thread.comment}
        slug={slug}
        currentUser={currentUser}
        showReplyBtn
      />
      {thread.replies.length > 0 && (
        <div className="ml-11 mt-4 space-y-4 border-l-2 border-zinc-100 pl-4">
          {thread.replies.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              slug={slug}
              currentUser={currentUser}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  )
}
