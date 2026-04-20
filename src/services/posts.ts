import { db } from '@/db'
import { posts, users, tags, postTags } from '@/db/schema'
import { eq, desc, and, ne, sql } from 'drizzle-orm'
import type { Post, User, Tag } from '@/db/schema'
import { estimateReadingTime } from '@/lib/tiptap'

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

async function attachTagsAndAuthors(
  rawPosts: (Post & { author: User })[],
): Promise<PostWithMeta[]> {
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

// ─── Tags ─────────────────────────────────────────────────────────────────────

/** Fetch all tags ordered by name */
export async function getAllTags(): Promise<Tag[]> {
  return db.select().from(tags).orderBy(tags.name)
}

/** Fetch a single tag by its slug */
export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const rows = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1)
  return rows[0] ?? null
}

/** Fetch all published posts that have a given tag slug */
export async function getPostsByTag(tagSlug: string): Promise<PostWithMeta[]> {
  const rows = await db
    .select({ post: posts, author: users })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .innerJoin(postTags, eq(posts.id, postTags.postId))
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(and(eq(posts.status, 'published'), eq(tags.slug, tagSlug)))
    .orderBy(desc(posts.publishedAt))

  const flat = rows.map((r) => ({ ...r.post, author: r.author }))
  return attachTagsAndAuthors(flat)
}

/** Count all published posts */
export async function getPublishedPostsCount(): Promise<number> {
  const rows = await db
    .select({ value: sql<number>`count(*)` })
    .from(posts)
    .where(eq(posts.status, 'published'))
  return rows[0]?.value ?? 0
}

/** Fetch a page of published posts (1-indexed) */
export async function getPublishedPostsPaged(
  page: number,
  pageSize: number,
): Promise<PostWithMeta[]> {
  const rows = await db
    .select({ post: posts, author: users })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.status, 'published'))
    .orderBy(desc(posts.publishedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const flat = rows.map((r) => ({ ...r.post, author: r.author }))
  return attachTagsAndAuthors(flat)
}

// ─── Slug ────────────────────────────────────────────────────────────────────

/** Returns true if the slug is not taken by any other post */
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  const rows = await db
    .select({ id: posts.id })
    .from(posts)
    .where(excludeId ? and(eq(posts.slug, slug), ne(posts.id, excludeId)) : eq(posts.slug, slug))
    .limit(1)
  return rows.length === 0
}

// ─── Dashboard CRUD ───────────────────────────────────────────────────────────

export interface CreatePostInput {
  authorId: string
  title: string
  slug: string
  excerpt?: string | null
  content: Record<string, unknown>
  coverImageUrl?: string | null
  status: 'draft' | 'published'
  tagIds: string[]
}

/** Create a new post and return its ID */
export async function createPost(input: CreatePostInput): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date()
  const readingTimeMinutes = estimateReadingTime(input.content)

  await db.insert(posts).values({
    id,
    authorId: input.authorId,
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt ?? null,
    content: input.content,
    coverImageUrl: input.coverImageUrl ?? null,
    status: input.status,
    readingTimeMinutes,
    publishedAt: input.status === 'published' ? now : null,
    createdAt: now,
    updatedAt: now,
  })

  if (input.tagIds.length) {
    await db.insert(postTags).values(input.tagIds.map((tagId) => ({ postId: id, tagId })))
  }

  if (input.status === 'published') {
    await db
      .update(users)
      .set({ publishedPostCount: sql`${users.publishedPostCount} + 1`, updatedAt: now })
      .where(eq(users.id, input.authorId))
  }

  return id
}

export interface UpdatePostInput {
  title: string
  slug: string
  excerpt?: string | null
  content: Record<string, unknown>
  coverImageUrl?: string | null
  status: 'draft' | 'published'
  tagIds: string[]
}

/** Update an existing post */
export async function updatePost(id: string, input: UpdatePostInput): Promise<void> {
  const current = await db
    .select()
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1)
    .then((r) => r[0])
  if (!current) throw new Error('Post not found')

  const now = new Date()
  const readingTimeMinutes = estimateReadingTime(input.content)
  const wasPublished = current.status === 'published'
  const willBePublished = input.status === 'published'

  await db
    .update(posts)
    .set({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt ?? null,
      content: input.content,
      coverImageUrl: input.coverImageUrl ?? null,
      status: input.status,
      readingTimeMinutes,
      publishedAt: willBePublished ? (current.publishedAt ?? now) : current.publishedAt,
      updatedAt: now,
    })
    .where(eq(posts.id, id))

  // Sync tags — delete all and re-insert
  await db.delete(postTags).where(eq(postTags.postId, id))
  if (input.tagIds.length) {
    await db.insert(postTags).values(input.tagIds.map((tagId) => ({ postId: id, tagId })))
  }

  // Sync author published count if status changed
  if (!wasPublished && willBePublished) {
    await db
      .update(users)
      .set({ publishedPostCount: sql`${users.publishedPostCount} + 1`, updatedAt: now })
      .where(eq(users.id, current.authorId))
  } else if (wasPublished && !willBePublished) {
    await db
      .update(users)
      .set({
        publishedPostCount: sql`CASE WHEN ${users.publishedPostCount} > 0 THEN ${users.publishedPostCount} - 1 ELSE 0 END`,
        updatedAt: now,
      })
      .where(eq(users.id, current.authorId))
  }
}

/** Delete a post by ID */
export async function deletePost(id: string): Promise<void> {
  const current = await db
    .select()
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1)
    .then((r) => r[0])
  if (!current) return

  await db.delete(posts).where(eq(posts.id, id))

  if (current.status === 'published') {
    await db
      .update(users)
      .set({
        publishedPostCount: sql`CASE WHEN ${users.publishedPostCount} > 0 THEN ${users.publishedPostCount} - 1 ELSE 0 END`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, current.authorId))
  }
}

/** Set a post's published/draft status */
export async function setPostStatus(id: string, status: 'draft' | 'published'): Promise<void> {
  const current = await db
    .select()
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1)
    .then((r) => r[0])
  if (!current || current.status === status) return

  const now = new Date()

  await db
    .update(posts)
    .set({
      status,
      publishedAt: status === 'published' ? (current.publishedAt ?? now) : current.publishedAt,
      updatedAt: now,
    })
    .where(eq(posts.id, id))

  if (status === 'published') {
    await db
      .update(users)
      .set({ publishedPostCount: sql`${users.publishedPostCount} + 1`, updatedAt: now })
      .where(eq(users.id, current.authorId))
  } else {
    await db
      .update(users)
      .set({
        publishedPostCount: sql`CASE WHEN ${users.publishedPostCount} > 0 THEN ${users.publishedPostCount} - 1 ELSE 0 END`,
        updatedAt: now,
      })
      .where(eq(users.id, current.authorId))
  }
}
