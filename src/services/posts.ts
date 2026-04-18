import { db } from '@/db'
import { posts, users, tags, postTags } from '@/db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import type { Post, User, Tag } from '@/db/schema'

/** Fetch a public author profile by ID (must have role author or admin) */
export async function getAuthorById(id: string): Promise<User | null> {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), sql`${users.role} IN ('author', 'admin')`))
    .limit(1)
  return rows[0] ?? null
}

export interface PostWithMeta extends Post {
  author: User
  tags: Tag[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function attachTagsAndAuthors(rawPosts: (Post & { author: User })[]): Promise<PostWithMeta[]> {
  if (!rawPosts.length) return []

  const postIds = rawPosts.map((p) => p.id)

  // Fetch all tag relations for these posts in one query
  const tagRows = await db
    .select({ postId: postTags.postId, tag: tags })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(sql`${postTags.postId} IN ${postIds}`)

  const tagsByPost = new Map<string, Tag[]>()
  for (const row of tagRows) {
    if (!tagsByPost.has(row.postId)) tagsByPost.set(row.postId, [])
    tagsByPost.get(row.postId)!.push(row.tag)
  }

  return rawPosts.map((p) => ({
    ...p,
    tags: tagsByPost.get(p.id) ?? [],
  }))
}

// ─── Public queries ───────────────────────────────────────────────────────────

/** Fetch the N most recent published posts for the landing page */
export async function getRecentPosts(limit = 7): Promise<PostWithMeta[]> {
  const rows = await db
    .select({ post: posts, author: users })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.status, 'published'))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)

  const flat = rows.map((r) => ({ ...r.post, author: r.author }))
  return attachTagsAndAuthors(flat)
}

/** Fetch a single published post by slug */
export async function getPostBySlug(slug: string): Promise<PostWithMeta | null> {
  const rows = await db
    .select({ post: posts, author: users })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.slug, slug), eq(posts.status, 'published')))
    .limit(1)

  if (!rows.length) return null

  const [{ post, author }] = rows
  const withMeta = await attachTagsAndAuthors([{ ...post, author }])
  return withMeta[0] ?? null
}

/** Fetch all published posts by a given author */
export async function getPostsByAuthor(authorId: string): Promise<PostWithMeta[]> {
  const rows = await db
    .select({ post: posts, author: users })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.authorId, authorId), eq(posts.status, 'published')))
    .orderBy(desc(posts.publishedAt))

  const flat = rows.map((r) => ({ ...r.post, author: r.author }))
  return attachTagsAndAuthors(flat)
}

// ─── Dashboard queries (author-scoped) ───────────────────────────────────────

/** All posts (any status) owned by a given author */
export async function getAuthorPosts(authorId: string): Promise<PostWithMeta[]> {
  const rows = await db
    .select({ post: posts, author: users })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.authorId, authorId))
    .orderBy(desc(posts.updatedAt))

  const flat = rows.map((r) => ({ ...r.post, author: r.author }))
  return attachTagsAndAuthors(flat)
}

/** Fetch a single post by ID (for editing — any status) */
export async function getPostById(id: string): Promise<PostWithMeta | null> {
  const rows = await db
    .select({ post: posts, author: users })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, id))
    .limit(1)

  if (!rows.length) return null
  const [{ post, author }] = rows
  const withMeta = await attachTagsAndAuthors([{ ...post, author }])
  return withMeta[0] ?? null
}
