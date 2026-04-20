import { db } from '@/db'
import { posts, postLikes, comments, users } from '@/db/schema'
import { eq, sql, and } from 'drizzle-orm'

// ─── Views ────────────────────────────────────────────────────────────────────

export async function incrementViews(postId: string): Promise<void> {
  await db
    .update(posts)
    .set({ views: sql`${posts.views} + 1` })
    .where(eq(posts.id, postId))
}

// ─── Likes ────────────────────────────────────────────────────────────────────

/** Returns whether the given IP has already liked this post */
export async function hasLiked(postId: string, ip: string): Promise<boolean> {
  const row = await db
    .select({ id: postLikes.id })
    .from(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.ip, ip)))
    .limit(1)
  return row.length > 0
}

/**
 * Toggle a like for postId from ip.
 * Returns the new like count and whether the post is now liked.
 */
export async function toggleLike(
  postId: string,
  ip: string,
): Promise<{ likes: number; liked: boolean }> {
  const already = await hasLiked(postId, ip)

  if (already) {
    // Unlike
    await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.ip, ip)))
    const [updated] = await db
      .update(posts)
      .set({ likes: sql`MAX(0, ${posts.likes} - 1)` })
      .where(eq(posts.id, postId))
      .returning({ likes: posts.likes })
    return { likes: updated?.likes ?? 0, liked: false }
  } else {
    // Like
    await db.insert(postLikes).values({ id: crypto.randomUUID(), postId, ip }).onConflictDoNothing()
    const [updated] = await db
      .update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, postId))
      .returning({ likes: posts.likes })
    return { likes: updated?.likes ?? 0, liked: true }
  }
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface CommentWithUser {
  id: string
  postId: string
  userId: string
  parentId: string | null
  content: string
  createdAt: Date
  updatedAt: Date
  user: {
    name: string
    avatarUrl: string | null
  }
}

export interface CommentThread {
  comment: CommentWithUser
  replies: CommentWithUser[]
}

/** Fetch all comments for a post, structured as top-level threads with replies */
export async function getCommentThreads(postId: string): Promise<CommentThread[]> {
  const rows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      userId: comments.userId,
      parentId: comments.parentId,
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt)

  const mapped: CommentWithUser[] = rows.map((r) => ({
    id: r.id,
    postId: r.postId,
    userId: r.userId,
    parentId: r.parentId,
    content: r.content,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    user: { name: r.userName, avatarUrl: r.userAvatarUrl },
  }))

  // Build thread structure: top-level comments + their replies
  const topLevel = mapped.filter((c) => !c.parentId)
  const byParent = new Map<string, CommentWithUser[]>()
  for (const c of mapped) {
    if (c.parentId) {
      const list = byParent.get(c.parentId) ?? []
      list.push(c)
      byParent.set(c.parentId, list)
    }
  }

  return topLevel.map((comment) => ({
    comment,
    replies: byParent.get(comment.id) ?? [],
  }))
}

/** Add a new comment or reply */
export async function addComment(data: {
  postId: string
  userId: string
  content: string
  parentId?: string | null
}): Promise<void> {
  const id = crypto.randomUUID()
  await db.insert(comments).values({
    id,
    postId: data.postId,
    userId: data.userId,
    parentId: data.parentId ?? null,
    content: data.content,
  })
}

/** Update a comment — only the owner can do this (caller must verify) */
export async function updateComment(id: string, userId: string, content: string): Promise<boolean> {
  const result = await db
    .update(comments)
    .set({ content, updatedAt: new Date() })
    .where(and(eq(comments.id, id), eq(comments.userId, userId)))
    .returning({ id: comments.id })
  return result.length > 0
}

/** Delete a comment — only the owner can do this (caller must verify) */
export async function deleteComment(id: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(comments)
    .where(and(eq(comments.id, id), eq(comments.userId, userId)))
    .returning({ id: comments.id })
  return result.length > 0
}

/** Get a single comment by id */
export async function getCommentById(id: string): Promise<CommentWithUser | null> {
  const rows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      userId: comments.userId,
      parentId: comments.parentId,
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.id, id))
    .limit(1)

  const r = rows[0]
  if (!r) return null

  return {
    id: r.id,
    postId: r.postId,
    userId: r.userId,
    parentId: r.parentId,
    content: r.content,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    user: { name: r.userName, avatarUrl: r.userAvatarUrl },
  }
}
