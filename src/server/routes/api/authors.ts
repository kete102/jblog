import { Hono } from 'hono'
import { getAuthorById, getPostsByAuthor } from '@/services/posts'
import { getAllAuthors } from '@/services/users'

// ─── /api/authors ─────────────────────────────────────────────────────────────

const router = new Hono()

// GET /api/authors — list all public authors
router.get('/', async (c) => {
  const authors = await getAllAuthors()
  return c.json({
    authors: authors.map((a) => ({
      id: a.id,
      name: a.name,
      avatarUrl: a.avatarUrl,
      bio: a.bio,
      socialLinks: a.socialLinks,
      publishedPostCount: a.publishedPostCount,
      role: a.role,
    })),
  })
})

// GET /api/authors/:id — single author profile + their published posts
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
