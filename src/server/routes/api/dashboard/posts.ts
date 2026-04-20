import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  getAuthorPosts,
  getPostById,
  getAllTags,
  isSlugAvailable,
  createPost,
  updatePost,
  deletePost,
  setPostStatus,
} from '@/services/posts'
import { requireAuthorApi } from '@/server/middleware/auth'
import slugify from 'slugify'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const upsertPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  slug: z.string().optional(),
  excerpt: z.string().max(500).nullable().optional(),
  content: z.record(z.string(), z.unknown()).default({}),
  coverImageUrl: z.string().url().nullable().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  tagIds: z.array(z.string()).default([]),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSlug(title: string): string {
  return slugify(title, { lower: true, strict: true, trim: true })
}

// ─── Router ───────────────────────────────────────────────────────────────────

const router = new Hono()

router.use('*', requireAuthorApi)

// ─── GET /api/dashboard/posts ─────────────────────────────────────────────────
// Returns all posts (any status) owned by the authenticated author.

router.get('/', async (c) => {
  const user = c.get('user')!
  const posts = await getAuthorPosts(user.id)

  return c.json(
    {
      posts: posts.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        coverImageUrl: p.coverImageUrl,
        status: p.status,
        views: p.views,
        likes: p.likes,
        publishedAt: p.publishedAt?.toISOString() ?? null,
        updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
        tags: p.tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
      })),
    },
    200,
  )
})

// ─── GET /api/dashboard/posts/tags ───────────────────────────────────────────
// Returns all available tags for the editor's tag picker.

router.get('/tags', async (c) => {
  const allTags = await getAllTags()
  return c.json({ tags: allTags }, 200)
})

// ─── GET /api/dashboard/posts/:id ────────────────────────────────────────────
// Returns a single post for editing (any status, author-scoped).

router.get('/:id', async (c) => {
  const user = c.get('user')!
  const post = await getPostById(c.req.param('id'))

  if (!post) return c.json({ error: 'Post not found' }, 404)
  if (post.authorId !== user.id && user.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const allTags = await getAllTags()

  return c.json(
    {
      post: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        coverImageUrl: post.coverImageUrl,
        content: post.content,
        status: post.status,
        tagIds: post.tags.map((t) => t.id),
      },
      allTags,
    },
    200,
  )
})

// ─── POST /api/dashboard/posts ────────────────────────────────────────────────
// Creates a new post. Returns the new post's ID.

router.post('/', zValidator('json', upsertPostSchema), async (c) => {
  const user = c.get('user')!
  const body = c.req.valid('json')

  const title = body.title.trim()
  const slug = body.slug?.trim() || makeSlug(title)

  if (!slug) return c.json({ error: 'Could not derive a slug from the title' }, 400)

  if (!(await isSlugAvailable(slug))) {
    return c.json({ error: 'This slug is already taken' }, 409)
  }

  const id = await createPost({
    authorId: user.id,
    title,
    slug,
    excerpt: body.excerpt ?? null,
    content: body.content,
    coverImageUrl: body.coverImageUrl ?? null,
    status: body.status,
    tagIds: body.tagIds,
  })

  return c.json({ id }, 201)
})

// ─── PUT /api/dashboard/posts/:id ─────────────────────────────────────────────
// Updates an existing post.

router.put('/:id', zValidator('json', upsertPostSchema), async (c) => {
  const user = c.get('user')!
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const post = await getPostById(id)
  if (!post) return c.json({ error: 'Post not found' }, 404)
  if (post.authorId !== user.id && user.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const title = body.title.trim()
  const slug = body.slug?.trim() || makeSlug(title)

  if (!slug) return c.json({ error: 'Could not derive a slug from the title' }, 400)

  if (!(await isSlugAvailable(slug, id))) {
    return c.json({ error: 'This slug is already taken' }, 409)
  }

  await updatePost(id, {
    title,
    slug,
    excerpt: body.excerpt ?? null,
    content: body.content,
    coverImageUrl: body.coverImageUrl ?? null,
    status: body.status,
    tagIds: body.tagIds,
  })

  return c.json({ ok: true }, 200)
})

// ─── POST /api/dashboard/posts/:id/publish ────────────────────────────────────
// Toggles the published/draft status of a post.

router.post('/:id/publish', async (c) => {
  const user = c.get('user')!
  const id = c.req.param('id')

  const post = await getPostById(id)
  if (!post) return c.json({ error: 'Post not found' }, 404)
  if (post.authorId !== user.id && user.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const newStatus = post.status === 'published' ? 'draft' : 'published'
  await setPostStatus(id, newStatus)

  return c.json({ ok: true, status: newStatus }, 200)
})

// ─── DELETE /api/dashboard/posts/:id ─────────────────────────────────────────
// Permanently deletes a post.

router.delete('/:id', async (c) => {
  const user = c.get('user')!
  const id = c.req.param('id')

  const post = await getPostById(id)
  if (!post) return c.json({ error: 'Post not found' }, 404)
  if (post.authorId !== user.id && user.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await deletePost(id)
  return c.json({ ok: true }, 200)
})

export default router
