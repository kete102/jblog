import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  getPublishedPostsPaged,
  getPublishedPostsCount,
  getPostBySlug,
  getPostsByTag,
  getTagBySlug,
} from '@/services/posts'
import {
  incrementViews,
  toggleLike,
  hasLiked,
  getCommentThreads,
} from '@/services/engagement'
import { getClientIp } from '@/lib/request'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const postsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  tag: z.string().optional(),
})

// ─── Router ───────────────────────────────────────────────────────────────────

const router = new Hono()

// ─── GET /api/posts ───────────────────────────────────────────────────────────
// Supports ?page=N for pagination and ?tag=:slug for tag filtering.

router.get('/', zValidator('query', postsQuerySchema), async (c) => {
  const { page, tag } = c.req.valid('query')

  // Tag filter: return posts for that tag along with tag metadata
  if (tag) {
    const [tagData, posts] = await Promise.all([
      getTagBySlug(tag),
      getPostsByTag(tag),
    ])

    if (!tagData) return c.json({ error: 'Tag not found' }, 404)

    return c.json(
      {
        tag: tagData,
        posts: posts.map(serializePost),
        total: posts.length,
      },
      200,
    )
  }

  // Paginated post listing
  const PAGE_SIZE = 6
  const [posts, total] = await Promise.all([
    getPublishedPostsPaged(page, PAGE_SIZE),
    getPublishedPostsCount(),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return c.json(
    {
      posts: posts.map(serializePost),
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    },
    200,
  )
})

// ─── GET /api/posts/:slug ─────────────────────────────────────────────────────
// Returns a single published post with its comments.
// Also increments the view counter (fire-and-forget).

router.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const post = await getPostBySlug(slug)
  if (!post) return c.json({ error: 'Post not found' }, 404)

  // Increment views without blocking the response
  incrementViews(post.id).catch(() => {})

  const ip = getClientIp(c)
  const [threads, liked] = await Promise.all([
    getCommentThreads(post.id),
    hasLiked(post.id, ip),
  ])

  return c.json(
    {
      post: serializePostFull(post),
      comments: threads,
      liked,
    },
    200,
  )
})

// ─── POST /api/posts/:slug/like ───────────────────────────────────────────────
// Toggles the like for the requesting IP. No authentication required.

router.post('/:slug/like', async (c) => {
  const slug = c.req.param('slug')
  const post = await getPostBySlug(slug)
  if (!post) return c.json({ error: 'Post not found' }, 404)

  const ip = getClientIp(c)
  const { liked, likes } = await toggleLike(post.id, ip)

  return c.json({ liked, likes }, 200)
})

// ─── Serializers ─────────────────────────────────────────────────────────────
// Lean shapes for list and detail responses — dates as ISO strings.

function serializePost(post: Awaited<ReturnType<typeof getPostBySlug>>) {
  if (!post) return null
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageUrl,
    status: post.status,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    readingTimeMinutes: post.readingTimeMinutes,
    views: post.views,
    likes: post.likes,
    author: {
      id: post.author.id,
      name: post.author.name,
      avatarUrl: post.author.avatarUrl,
      publishedPostCount: post.author.publishedPostCount,
    },
    tags: post.tags,
  }
}

function serializePostFull(post: Awaited<ReturnType<typeof getPostBySlug>>) {
  if (!post) return null
  return {
    ...serializePost(post),
    content: post.content,
    author: {
      id: post.author.id,
      name: post.author.name,
      avatarUrl: post.author.avatarUrl,
      bio: post.author.bio,
      socialLinks: post.author.socialLinks,
      publishedPostCount: post.author.publishedPostCount,
      role: post.author.role,
    },
  }
}

export default router
