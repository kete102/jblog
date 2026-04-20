import { Hono } from 'hono'
import { getAuthorById, getPostsByAuthor } from '@/services/posts'

// ─── GET /api/authors/:id ─────────────────────────────────────────────────────
// Returns a public author profile along with all their published posts.

const router = new Hono()

router.get('/:id', async (c) => {
  const { id } = c.req.param()

  const [author, posts] = await Promise.all([getAuthorById(id), getPostsByAuthor(id)])

  if (!author) return c.json({ error: 'Author not found' }, 404)

  return c.json(
    {
      author: {
        id: author.id,
        name: author.name,
        avatarUrl: author.avatarUrl,
        bio: author.bio,
        socialLinks: author.socialLinks,
        publishedPostCount: author.publishedPostCount,
        role: author.role,
      },
      posts: posts.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        coverImageUrl: p.coverImageUrl,
        publishedAt: p.publishedAt?.toISOString() ?? null,
        readingTimeMinutes: p.readingTimeMinutes,
        views: p.views,
        likes: p.likes,
        tags: p.tags,
      })),
    },
    200,
  )
})

export default router
