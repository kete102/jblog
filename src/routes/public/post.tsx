import { Hono } from 'hono'
import React from 'react'
import { getCookie, setCookie } from 'hono/cookie'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Avatar from '@/components/blog/Avatar'
import AuthorBadge from '@/components/blog/AuthorBadge'
import TagPill from '@/components/blog/TagPill'
import { CommentThreadItem } from '@/components/blog/CommentThread'
import { EyeIcon, HeartIcon, ChatBubbleIcon, LinkIcon, PencilIcon, GoogleIcon } from '@/components/icons'
import { getPostBySlug } from '@/services/posts'
import { incrementViews, toggleLike, hasLiked, getCommentThreads, addComment, updateComment, deleteComment } from '@/services/engagement'
import { tiptapToHtml } from '@/lib/tiptap'
import { buildSeoTags, jsonLdArticle } from '@/lib/seo'
import { formatDate, formatNumber } from '@/lib/format'
import { isVerifiedAuthor } from '@/lib/roles'
import { getClientIp } from '@/lib/request'
import type { User } from '@/db/schema'

const postRouter = new Hono()

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

// ─── GET /post/:slug ─────────────────────────────────────────────────────────

postRouter.get('/:slug', async (c) => {
  const user = c.get('user') as User | null
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
                <TagPill key={tag.id} tag={tag} variant="page" />
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
              <Avatar
                name={post.author.name}
                avatarUrl={post.author.avatarUrl}
                size="lg"
                ring
              />
              <div>
                <p className="text-sm font-semibold text-zinc-800 group-hover:text-indigo-600 transition-colors leading-none mb-0.5 flex items-center gap-1">
                  {post.author.name}
                  {isVerifiedAuthor(post.author) && <AuthorBadge />}
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
                <EyeIcon className="w-4 h-4" />
                {formatNumber(post.views + 1)}
              </span>
              {/* Comments */}
              <a href="#comments" className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors">
                <ChatBubbleIcon className="w-4 h-4" />
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
                <LinkIcon id="copy-link-icon" className="w-4 h-4" />
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
              <Avatar
                name={post.author.name}
                avatarUrl={post.author.avatarUrl}
                size="xl"
                ring
                loading="lazy"
                className="shrink-0"
              />
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Written by</p>
                <p className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                  {post.author.name}
                  {isVerifiedAuthor(post.author) && <AuthorBadge className="w-4 h-4" />}
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
                <PencilIcon className="w-4 h-4 text-white" />
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
                  <Avatar name={user.name} avatarUrl={user.avatarUrl ?? null} size="lg" />
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
                  <GoogleIcon className="w-4 h-4" />
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
