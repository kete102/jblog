import { Hono } from 'hono'
import React from 'react'
import { requireAuthor } from '@/middleware/auth'
import {
  getPostById,
  getAllTags,
  isSlugAvailable,
  createPost,
  updatePost,
  deletePost,
  setPostStatus,
} from '@/services/posts'
import slugify from 'slugify'

const router = new Hono()

router.use('*', requireAuthor)

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Embed post data as a JSON script tag for the client-side editor */
function safeJson(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

function makeSlug(title: string): string {
  return slugify(title, { lower: true, strict: true, trim: true })
}

// ─── GET /dashboard/post/new ─────────────────────────────────────────────────

router.get('/new', async (c) => {
  const allTags = await getAllTags()

  const editorData = {
    postId: null,
    title: '',
    slug: '',
    excerpt: '',
    coverImageUrl: '',
    content: {},
    status: 'draft' as const,
    tagIds: [],
    allTags,
  }

  return c.render(
    <>
      <script
        id="editor-data"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: safeJson(editorData) }}
      />
      <div id="editor-root" className="min-h-screen" />
    </>,
    { seo: { title: 'New Post', noIndex: true }, clientBundle: 'editor' },
  )
})

// ─── GET /dashboard/post/:id/edit ─────────────────────────────────────────────

router.get('/:id/edit', async (c) => {
  const user = c.get('user')!
  const post = await getPostById(c.req.param('id'))

  if (!post) return c.notFound()
  if (post.authorId !== user.id && user.role !== 'admin') return c.notFound()

  const allTags = await getAllTags()

  const editorData = {
    postId: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? '',
    coverImageUrl: post.coverImageUrl ?? '',
    content: post.content ?? {},
    status: post.status,
    tagIds: post.tags.map((t) => t.id),
    allTags,
  }

  return c.render(
    <>
      <script
        id="editor-data"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: safeJson(editorData) }}
      />
      <div id="editor-root" className="min-h-screen" />
    </>,
    { seo: { title: `Edit: ${post.title}`, noIndex: true }, clientBundle: 'editor' },
  )
})

// ─── POST /dashboard/post (create) ───────────────────────────────────────────

router.post('/', async (c) => {
  const user = c.get('user')!

  let body: {
    title?: string
    slug?: string
    excerpt?: string
    content?: Record<string, unknown>
    coverImageUrl?: string
    status?: string
    tagIds?: string[]
  }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ message: 'Invalid JSON body' }, 400)
  }

  const title = body.title?.trim()
  if (!title) return c.json({ message: 'Title is required' }, 400)

  const slug = body.slug?.trim() || makeSlug(title)
  if (!slug) return c.json({ message: 'Slug is required' }, 400)

  if (!(await isSlugAvailable(slug))) {
    return c.json({ message: 'This slug is already taken' }, 409)
  }

  const status = body.status === 'published' ? 'published' : 'draft'

  const id = await createPost({
    authorId: user.id,
    title,
    slug,
    excerpt: body.excerpt ?? null,
    content: body.content ?? {},
    coverImageUrl: body.coverImageUrl || null,
    status,
    tagIds: Array.isArray(body.tagIds) ? body.tagIds : [],
  })

  return c.json({ id })
})

// ─── POST /dashboard/post/:id (update) ───────────────────────────────────────

router.post('/:id', async (c) => {
  const user = c.get('user')!
  const id = c.req.param('id')

  const post = await getPostById(id)
  if (!post) return c.json({ message: 'Post not found' }, 404)
  if (post.authorId !== user.id && user.role !== 'admin') {
    return c.json({ message: 'Forbidden' }, 403)
  }

  let body: {
    title?: string
    slug?: string
    excerpt?: string
    content?: Record<string, unknown>
    coverImageUrl?: string
    status?: string
    tagIds?: string[]
  }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ message: 'Invalid JSON body' }, 400)
  }

  const title = body.title?.trim()
  if (!title) return c.json({ message: 'Title is required' }, 400)

  const slug = body.slug?.trim() || makeSlug(title)
  if (!slug) return c.json({ message: 'Slug is required' }, 400)

  if (!(await isSlugAvailable(slug, id))) {
    return c.json({ message: 'This slug is already taken' }, 409)
  }

  const status = body.status === 'published' ? 'published' : 'draft'

  await updatePost(id, {
    title,
    slug,
    excerpt: body.excerpt ?? null,
    content: body.content ?? {},
    coverImageUrl: body.coverImageUrl || null,
    status,
    tagIds: Array.isArray(body.tagIds) ? body.tagIds : [],
  })

  return c.json({ ok: true })
})

// ─── POST /dashboard/post/:id/delete ─────────────────────────────────────────

router.post('/:id/delete', async (c) => {
  const user = c.get('user')!
  const id = c.req.param('id')

  const post = await getPostById(id)
  if (post && post.authorId !== user.id && user.role !== 'admin') {
    return c.redirect('/dashboard')
  }

  await deletePost(id)
  return c.redirect('/dashboard')
})

// ─── POST /dashboard/post/:id/publish ────────────────────────────────────────

router.post('/:id/publish', async (c) => {
  const user = c.get('user')!
  const id = c.req.param('id')

  const post = await getPostById(id)
  if (!post || (post.authorId !== user.id && user.role !== 'admin')) {
    return c.redirect('/dashboard')
  }

  const newStatus = post.status === 'published' ? 'draft' : 'published'
  await setPostStatus(id, newStatus)
  return c.redirect('/dashboard')
})

export default router
