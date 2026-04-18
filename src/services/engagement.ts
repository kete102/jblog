import { db } from '@/db'
import { posts, postLikes, comments } from '@/db/schema'
import type { Comment, NewComment } from '@/db/schema'
import { eq, sql, and, desc } from 'drizzle-orm'

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
    await db
      .delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.ip, ip)))
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

export async function getComments(postId: string): Promise<Comment[]> {
  return db
    .select()
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt))
}

export async function addComment(data: NewComment): Promise<Comment> {
  const id = crypto.randomUUID()
  await db.insert(comments).values({ ...data, id })
  const [row] = await db.select().from(comments).where(eq(comments.id, id))
  return row
}
