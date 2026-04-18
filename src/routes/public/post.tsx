import { Hono } from 'hono'
import React from 'react'
import { getCookie, setCookie } from 'hono/cookie'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AuthorBadge from '@/components/blog/AuthorBadge'
import { getPostBySlug } from '@/services/posts'
import { incrementViews, toggleLike, hasLiked, getCommentThreads, addComment, updateComment, deleteComment } from '@/services/engagement'
import type { CommentWithUser, CommentThread } from '@/services/engagement'
import { tiptapToHtml } from '@/lib/tiptap'
import { buildSeoTags, jsonLdArticle } from '@/lib/seo'
import type { User } from '@/db/schema'

const postRouter = new Hono()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date | null) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function getClientIp(c: { req: { header: (key: string) => string | undefined }; env?: Record<string, unknown> }): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    '0.0.0.0'
  )
}

// ─── Like button client script ─────────────────────────────────────────────
// Runs in the browser. Handles both the compact (top) and full (bottom)
// like buttons, keeping them in sync without a page reload.
const likeScript = /* js */`(function () {
  var STATE = { liked: false, likes: 0, slug: '', pending: false };

  function fmtNum(n) {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  }

  function updateAll() {
    document.querySelectorAll('[data-like-btn]').forEach(function (btn) {
      var variant = btn.dataset.likeVariant;
      if (variant === 'full') {
        btn.className = STATE.liked
          ? 'group flex items-center gap-2.5 px-6 py-3 rounded-full border-2 transition-all font-medium text-sm cursor-pointer border-pink-300 bg-pink-50 text-pink-600'
          : 'group flex items-center gap-2.5 px-6 py-3 rounded-full border-2 transition-all font-medium text-sm cursor-pointer border-zinc-200 bg-white text-zinc-500 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50';
      } else {
        btn.className = STATE.liked
          ? 'flex items-center gap-1.5 text-sm transition-colors text-pink-500 cursor-pointer'
          : 'flex items-center gap-1.5 text-sm transition-colors text-zinc-400 hover:text-pink-500 cursor-pointer';
      }
    });
    document.querySelectorAll('[data-like-heart]').forEach(function (el) {
      var btn = el.closest('[data-like-btn]');
      var isFull = btn && btn.dataset.likeVariant === 'full';
      var base = isFull ? 'w-5 h-5 transition-transform group-hover:scale-110' : 'w-4 h-4';
      el.setAttribute('class', base + (STATE.liked
        ? ' fill-pink-500 stroke-pink-500'
        : ' fill-none stroke-current'));
    });
    document.querySelectorAll('[data-like-count]').forEach(function (el) {
      el.textContent = fmtNum(STATE.likes);
    });
    var label = document.querySelector('[data-like-label]');
    if (label) label.textContent = STATE.liked ? 'Liked' : 'Like this post';
  }

  var first = document.querySelector('[data-like-btn]');
  if (!first) return;
  STATE.slug = first.dataset.slug;
  STATE.liked = first.dataset.liked === 'true';
  STATE.likes = parseInt(first.dataset.likes, 10) || 0;

  document.querySelectorAll('[data-like-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (STATE.pending) return;
      STATE.pending = true;
      var prevLiked = STATE.liked;
      var prevLikes = STATE.likes;
      STATE.liked = !STATE.liked;
      STATE.likes = STATE.liked ? STATE.likes + 1 : STATE.likes - 1;
      if (STATE.liked) {
        document.querySelectorAll('[data-like-heart]').forEach(function (el) {
          el.classList.remove('heart-pop');
          void el.offsetWidth;
          el.classList.add('heart-pop');
        });
      }
      updateAll();
      fetch('/post/' + STATE.slug + '/like', {
        method: 'POST',
        headers: { 'X-Requested-With': 'xmlhttprequest' }
      })
        .then(function (r) {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then(function (data) {
          STATE.liked = data.liked;
          STATE.likes = data.likes;
          updateAll();
        })
        .catch(function () {
          STATE.liked = prevLiked;
          STATE.likes = prevLikes;
          updateAll();
        })
        .finally(function () { STATE.pending = false; });
    });
  });
})();`

// ─── Comment interaction script (reply, edit toggling) ────────────────────────
const commentScript = /* js */`(function () {
  // Reply toggle
  document.querySelectorAll('[data-reply-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var commentId = btn.dataset.replyBtn;
      var form = document.getElementById('reply-form-' + commentId);
      if (!form) return;
      var isHidden = form.classList.contains('hidden');
      // Close all reply forms first
      document.querySelectorAll('[id^="reply-form-"]').forEach(function (f) {
        f.classList.add('hidden');
      });
      if (isHidden) {
        form.classList.remove('hidden');
        form.querySelector('textarea').focus();
      }
    });
  });

  // Edit toggle
  document.querySelectorAll('[data-edit-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var commentId = btn.dataset.editBtn;
      var content = document.getElementById('comment-content-' + commentId);
      var editForm = document.getElementById('edit-form-' + commentId);
      var actions = document.getElementById('comment-actions-' + commentId);
      if (!content || !editForm) return;
      content.classList.add('hidden');
      editForm.classList.remove('hidden');
      if (actions) actions.classList.add('hidden');
      editForm.querySelector('textarea').focus();
    });
  });

  // Edit cancel
  document.querySelectorAll('[data-edit-cancel]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var commentId = btn.dataset.editCancel;
      var content = document.getElementById('comment-content-' + commentId);
      var editForm = document.getElementById('edit-form-' + commentId);
      var actions = document.getElementById('comment-actions-' + commentId);
      if (!content || !editForm) return;
      editForm.classList.add('hidden');
      content.classList.remove('hidden');
      if (actions) actions.classList.remove('hidden');
    });
  });

  // Reply cancel
  document.querySelectorAll('[data-reply-cancel]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var commentId = btn.dataset.replyCancel;
      var form = document.getElementById('reply-form-' + commentId);
      if (form) form.classList.add('hidden');
    });
  });
})();`

// ─── Copy link script ──────────────────────────────────────────────────────────
const copyScript = /* js */`(function () {
  var btn = document.getElementById('copy-link-btn');
  var icon = document.getElementById('copy-link-icon');
  var label = document.getElementById('copy-link-label');
  if (!btn) return;

  var checkIcon = '<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />';
  var linkIcon = '<path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />';
  var timer;

  btn.addEventListener('click', function () {
    navigator.clipboard.writeText(window.location.href).then(function () {
      icon.innerHTML = checkIcon;
      label.textContent = 'Copied!';
      btn.classList.remove('text-zinc-400', 'hover:text-indigo-500');
      btn.classList.add('text-indigo-500');
      clearTimeout(timer);
      timer = setTimeout(function () {
        icon.innerHTML = linkIcon;
        label.textContent = 'Copy link';
        btn.classList.remove('text-indigo-500');
        btn.classList.add('text-zinc-400', 'hover:text-indigo-500');
      }, 2000);
    });
  });
})();`

function CommentAvatar({ user, size = 'sm' }: { user: { name: string; avatarUrl: string | null }; size?: 'sm' | 'md' }) {
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const cls = size === 'sm'
    ? 'w-8 h-8 text-xs'
    : 'w-9 h-9 text-sm'

  return user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={user.name}
      className={`${cls} rounded-full object-cover shrink-0`}
    />
  ) : (
    <div className={`${cls} rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold shrink-0`}>
      {initials}
    </div>
  )
}

// ─── Single comment row ───────────────────────────────────────────────────────

function CommentRow({
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
      <CommentAvatar user={comment.user} size={isReply ? 'sm' : 'md'} />
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
              <CommentAvatar user={{ name: currentUser.name, avatarUrl: currentUser.avatarUrl ?? null }} size="sm" />
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

// ─── Comment thread (top-level + replies) ─────────────────────────────────────

function CommentThreadItem({
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

// ─── GET /post/:slug ─────────────────────────────────────────────────────────

postRouter.get('/:slug', async (c) => {
  const user = c.get('user')
  const slug = c.req.param('slug')

  const post = await getPostBySlug(slug)
  if (!post) return c.notFound()

  incrementViews(post.id).catch(() => {})

  const ip = getClientIp(c)
  const [threads, alreadyLiked] = await Promise.all([
    getCommentThreads(post.id),
    hasLiked(post.id, ip),
  ])

  const likedCookie = getCookie(c, `liked_${post.id}`) === '1'
  const liked = alreadyLiked || likedCookie

  const totalComments = threads.reduce((sum, t) => sum + 1 + t.replies.length, 0)

  const contentHtml = tiptapToHtml(post.content ?? {})
  const postUrl = `${process.env.BASE_URL}/post/${post.slug}`

  const seo = buildSeoTags({
    title: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverImageUrl ?? undefined,
    url: postUrl,
    type: 'article',
    publishedTime: post.publishedAt?.toISOString(),
    author: post.author.name,
    tags: post.tags.map((t) => t.name),
  })

  const jsonLd = jsonLdArticle({
    title: post.title,
    description: post.excerpt ?? undefined,
    url: postUrl,
    image: post.coverImageUrl ?? undefined,
    publishedTime: post.publishedAt?.toISOString(),
    authorName: post.author.name,
    authorUrl: `${process.env.BASE_URL}/author/${post.author.id}`,
  })

  const isReader = user && user.role === 'reader'

  return c.render(
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1">
        <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 animate-fade-in-up">

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {post.tags.map((tag) => (
                <a
                  key={tag.id}
                  href={`/tag/${tag.slug}`}
                  className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full hover:bg-indigo-100 transition-colors"
                >
                  {tag.name}
                </a>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 leading-tight tracking-tight mb-5">
            {post.title}
          </h1>

          {/* Meta row */}
          <div className="flex items-center justify-between gap-4 pb-8 border-b border-zinc-100 mb-8 flex-wrap">
            {/* Author */}
            <a href={`/author/${post.author.id}`} className="flex items-center gap-2.5 group">
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-zinc-100"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
                  {post.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-zinc-800 group-hover:text-indigo-600 transition-colors leading-none mb-0.5 flex items-center gap-1">
                  {post.author.name}
                  {(post.author.role === 'author' || post.author.role === 'admin') && (
                    <AuthorBadge />
                  )}
                </p>
                <p className="text-xs text-zinc-400">
                  <time dateTime={post.publishedAt?.toISOString()}>
                    {formatDate(post.publishedAt)}
                  </time>
                  {post.readingTimeMinutes && (
                    <> · {post.readingTimeMinutes} min read</>
                  )}
                </p>
              </div>
            </a>

            {/* Engagement stats + compact like button */}
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              {/* Views */}
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                {formatNumber(post.views + 1)}
              </span>
              {/* Comments */}
              <a href="#comments" className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                {formatNumber(totalComments)}
              </a>
              {/* Compact like button (top) */}
              <button
                type="button"
                data-like-btn
                data-like-variant="compact"
                data-slug={post.slug}
                data-liked={liked ? 'true' : 'false'}
                data-likes={String(post.likes)}
                className={`flex items-center gap-1.5 text-sm transition-colors cursor-pointer ${
                  liked ? 'text-pink-500' : 'text-zinc-400 hover:text-pink-500'
                }`}
              >
                <svg
                  data-like-heart
                  className={`w-4 h-4 ${liked ? 'fill-pink-500 stroke-pink-500' : 'fill-none stroke-current'}`}
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                <span data-like-count>{formatNumber(post.likes)}</span>
              </button>

              {/* Copy link button */}
              <button
                id="copy-link-btn"
                type="button"
                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-indigo-500 transition-colors cursor-pointer"
                aria-label="Copy link"
              >
                <svg id="copy-link-icon" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
                <span id="copy-link-label">Copy link</span>
              </button>
            </div>
          </div>

          {/* Cover image */}
          {post.coverImageUrl && (
            <figure className="mb-10 -mx-4 sm:-mx-6 lg:-mx-12">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full max-h-[480px] object-cover rounded-2xl"
              />
            </figure>
          )}

          {/* Body */}
          <div
            className="prose prose-zinc prose-lg max-w-none prose-headings:font-bold prose-a:text-indigo-600 prose-code:before:content-none prose-code:after:content-none"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {/* ── Author card ── */}
          <div className="mt-12 pt-8 border-t border-zinc-100">
            <a href={`/author/${post.author.id}`} className="flex items-start gap-4 group">
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-zinc-100 shrink-0"
                  loading="lazy"
                  width={56}
                  height={56}
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold shrink-0">
                  {post.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Written by</p>
                <p className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                  {post.author.name}
                  {(post.author.role === 'author' || post.author.role === 'admin') && (
                    <AuthorBadge className="w-4 h-4" />
                  )}
                </p>
                {post.author.bio && (
                  <p className="text-sm text-zinc-500 mt-1 leading-relaxed line-clamp-2">
                    {post.author.bio}
                  </p>
                )}
                <p className="text-xs text-indigo-500 mt-2 font-medium">
                  {post.author.publishedPostCount} published post{post.author.publishedPostCount !== 1 ? 's' : ''}
                </p>
              </div>
            </a>
          </div>

          {/* ── Become-author CTA (logged-in readers only) ── */}
          {isReader && (
            <div className="mt-8 p-5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-indigo-900 mb-0.5">Want to write for jblog?</p>
                <p className="text-sm text-indigo-700 mb-3">Share your knowledge with our community. Apply to become an author.</p>
                <a
                  href="/dashboard/become-author"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Apply now →
                </a>
              </div>
            </div>
          )}

          {/* ── Comments ── */}
          <section className="mt-12 pt-8 border-t border-zinc-100" id="comments">
            <h2 className="text-xl font-bold text-zinc-900 mb-8">
              {totalComments > 0
                ? `${totalComments} Comment${totalComments !== 1 ? 's' : ''}`
                : 'Comments'}
            </h2>

            {/* Thread list */}
            {threads.length > 0 && (
              <div className="space-y-8 mb-10">
                {threads.map((thread) => (
                  <CommentThreadItem
                    key={thread.comment.id}
                    thread={thread}
                    slug={post.slug}
                    currentUser={user}
                  />
                ))}
              </div>
            )}

            {threads.length === 0 && (
              <p className="text-zinc-400 text-sm mb-8">
                No comments yet. Be the first to share your thoughts!
              </p>
            )}

            {/* Comment form or login CTA */}
            {user ? (
              <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
                <div className="flex items-center gap-3 mb-4">
                  <CommentAvatar user={{ name: user.name, avatarUrl: user.avatarUrl ?? null }} size="md" />
                  <p className="text-sm font-semibold text-zinc-700">{user.name}</p>
                </div>
                <form method="POST" action={`/post/${post.slug}/comment`} className="space-y-4">
                  <div>
                    <textarea
                      name="content"
                      required
                      minLength={3}
                      maxLength={1000}
                      rows={4}
                      placeholder="Share your thoughts…"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Post comment
                  </button>
                </form>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center">
                <p className="text-sm font-semibold text-zinc-800 mb-1">Join the conversation</p>
                <p className="text-sm text-zinc-500 mb-4">Sign in to leave a comment and reply to others.</p>
                <a
                  href="/auth/google"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </a>
              </div>
            )}
          </section>

        </article>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <script dangerouslySetInnerHTML={{ __html: likeScript }} />
      <script dangerouslySetInnerHTML={{ __html: commentScript }} />
      <script dangerouslySetInnerHTML={{ __html: copyScript }} />
      <Footer />
    </div>,
    { seo },
  )
})

// ─── POST /post/:slug/like ────────────────────────────────────────────────────

postRouter.post('/:slug/like', async (c) => {
  const slug = c.req.param('slug')
  const post = await getPostBySlug(slug)
  if (!post) return c.notFound()

  const ip = getClientIp(c)
  const { liked, likes } = await toggleLike(post.id, ip)

  setCookie(c, `liked_${post.id}`, liked ? '1' : '0', {
    httpOnly: false,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  })

  // Return JSON for fetch requests; redirect for plain form fallback
  if (c.req.header('x-requested-with') === 'xmlhttprequest') {
    return c.json({ liked, likes })
  }

  return c.redirect(`/post/${slug}`, 303)
})

// ─── POST /post/:slug/comment ─────────────────────────────────────────────────

postRouter.post('/:slug/comment', async (c) => {
  const user = c.get('user')
  if (!user) return c.redirect('/auth/google')

  const slug = c.req.param('slug')
  const post = await getPostBySlug(slug)
  if (!post) return c.notFound()

  const body = await c.req.parseBody()
  const content = String(body.content ?? '').trim().slice(0, 1000)
  const parentId = String(body.parentId ?? '').trim() || null

  if (!content) return c.redirect(`/post/${slug}#comments`, 303)

  await addComment({ postId: post.id, userId: user.id, content, parentId })

  return c.redirect(`/post/${slug}#comments`, 303)
})

// ─── POST /post/:slug/comment/:id/edit ────────────────────────────────────────

postRouter.post('/:slug/comment/:id/edit', async (c) => {
  const user = c.get('user')
  if (!user) return c.redirect('/auth/google')

  const slug = c.req.param('slug')
  const id = c.req.param('id')

  const body = await c.req.parseBody()
  const content = String(body.content ?? '').trim().slice(0, 1000)

  if (content.length >= 3) {
    await updateComment(id, user.id, content)
  }

  return c.redirect(`/post/${slug}#comments`, 303)
})

// ─── POST /post/:slug/comment/:id/delete ─────────────────────────────────────

postRouter.post('/:slug/comment/:id/delete', async (c) => {
  const user = c.get('user')
  if (!user) return c.redirect('/auth/google')

  const slug = c.req.param('slug')
  const id = c.req.param('id')

  await deleteComment(id, user.id)

  return c.redirect(`/post/${slug}#comments`, 303)
})

export default postRouter
