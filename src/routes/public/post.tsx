import { Hono } from 'hono'
import React from 'react'
import { getCookie, setCookie } from 'hono/cookie'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getPostBySlug } from '@/services/posts'
import { incrementViews, toggleLike, hasLiked, getComments, addComment } from '@/services/engagement'
import { tiptapToHtml } from '@/lib/tiptap'
import { buildSeoTags, jsonLdArticle } from '@/lib/seo'
import type { Comment } from '@/db/schema'

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

// ─── Comment component ───────────────────────────────────────────────────────

function CommentItem({ comment }: { comment: Comment }) {
  const initials = comment.authorName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold text-zinc-900">{comment.authorName}</span>
          <time className="text-xs text-zinc-400">
            {formatDate(comment.createdAt)}
          </time>
        </div>
        <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
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
  const [postComments, alreadyLiked] = await Promise.all([
    getComments(post.id),
    hasLiked(post.id, ip),
  ])

  const likedCookie = getCookie(c, `liked_${post.id}`) === '1'
  const liked = alreadyLiked || likedCookie

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

  return c.render(
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1">
        <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 animate-fade-in-up">

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {post.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full"
                >
                  {tag.name}
                </span>
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
                <p className="text-sm font-semibold text-zinc-800 group-hover:text-indigo-600 transition-colors leading-none mb-0.5">
                  {post.author.name}
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
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                {formatNumber(postComments.length)}
              </span>
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

          {/* ── Like button (full, bottom) ── */}
          <div className="mt-12 flex items-center justify-center">
            <button
              type="button"
              data-like-btn
              data-like-variant="full"
              data-slug={post.slug}
              data-liked={liked ? 'true' : 'false'}
              data-likes={String(post.likes)}
              className={`group flex items-center gap-2.5 px-6 py-3 rounded-full border-2 transition-all font-medium text-sm cursor-pointer ${
                liked
                  ? 'border-pink-300 bg-pink-50 text-pink-600'
                  : 'border-zinc-200 bg-white text-zinc-500 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50'
              }`}
            >
              <svg
                data-like-heart
                className={`w-5 h-5 transition-transform group-hover:scale-110 ${liked ? 'fill-pink-500 stroke-pink-500' : 'fill-none stroke-current'}`}
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              <span>
                <span data-like-label>{liked ? 'Liked' : 'Like this post'}</span>
                {' · '}
                <span data-like-count>{formatNumber(post.likes)}</span>
              </span>
            </button>
          </div>

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
                <p className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                  {post.author.name}
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

          {/* ── Comments ── */}
          <section className="mt-12 pt-8 border-t border-zinc-100" id="comments">
            <h2 className="text-xl font-bold text-zinc-900 mb-8">
              {postComments.length > 0 ? `${postComments.length} Comment${postComments.length !== 1 ? 's' : ''}` : 'Comments'}
            </h2>

            {postComments.length > 0 ? (
              <div className="space-y-6 mb-10">
                {postComments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            ) : (
              <p className="text-zinc-400 text-sm mb-8">
                No comments yet. Be the first to share your thoughts!
              </p>
            )}

            {/* Comment form */}
            <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
              <h3 className="text-sm font-semibold text-zinc-700 mb-4">Leave a comment</h3>
              <form method="POST" action={`/post/${post.slug}/comment`} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="authorName" className="block text-xs font-medium text-zinc-600 mb-1.5">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="authorName"
                      name="authorName"
                      type="text"
                      required
                      maxLength={80}
                      placeholder="Your name"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="authorEmail" className="block text-xs font-medium text-zinc-600 mb-1.5">
                      Email <span className="text-zinc-400 font-normal">(optional, not shown)</span>
                    </label>
                    <input
                      id="authorEmail"
                      name="authorEmail"
                      type="email"
                      maxLength={120}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="content" className="block text-xs font-medium text-zinc-600 mb-1.5">
                    Comment <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    required
                    minLength={3}
                    maxLength={1000}
                    rows={4}
                    placeholder="Share your thoughts..."
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
          </section>

        </article>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      {/* Like button SPA script */}
      <script dangerouslySetInnerHTML={{ __html: likeScript }} />
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
  const slug = c.req.param('slug')
  const post = await getPostBySlug(slug)
  if (!post) return c.notFound()

  const body = await c.req.parseBody()
  const authorName = String(body.authorName ?? '').trim().slice(0, 80)
  const authorEmail = String(body.authorEmail ?? '').trim().slice(0, 120) || undefined
  const content = String(body.content ?? '').trim().slice(0, 1000)

  if (!authorName || !content) {
    return c.redirect(`/post/${slug}#comments`, 303)
  }

  await addComment({ postId: post.id, authorName, authorEmail, content })

  return c.redirect(`/post/${slug}#comments`, 303)
})

export default postRouter
