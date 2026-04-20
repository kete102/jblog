import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getPostBySlug } from '@/services/posts'
import { addComment, updateComment, deleteComment, getCommentById } from '@/services/engagement'
import { requireAuthApi } from '@/server/middleware/auth'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createCommentSchema = z.object({
  postSlug: z.string().min(1),
  content: z.string().min(3).max(1000),
  parentId: z.string().nullable().optional(),
})

const updateCommentSchema = z.object({
  content: z.string().min(3).max(1000),
})

// ─── Router ───────────────────────────────────────────────────────────────────

const router = new Hono()

// All comment mutations require authentication
router.use('*', requireAuthApi)

// ─── POST /api/comments ───────────────────────────────────────────────────────
// Creates a new top-level comment or a reply (parentId set).

router.post('/', zValidator('json', createCommentSchema), async (c) => {
  const user = c.get('user')!
  const { postSlug, content, parentId } = c.req.valid('json')

  const post = await getPostBySlug(postSlug)
  if (!post) return c.json({ error: 'Post not found' }, 404)

  await addComment({
    postId: post.id,
    userId: user.id,
    content,
    parentId: parentId ?? null,
  })

  return c.json({ ok: true }, 201)
})

// ─── PUT /api/comments/:id ────────────────────────────────────────────────────
// Updates an existing comment. Only the comment owner may edit.

router.put('/:id', zValidator('json', updateCommentSchema), async (c) => {
  const user = c.get('user')!
  const id = c.req.param('id')
  const { content } = c.req.valid('json')

  const comment = await getCommentById(id)
  if (!comment) return c.json({ error: 'Comment not found' }, 404)
  if (comment.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)

  const updated = await updateComment(id, user.id, content)
  if (!updated) return c.json({ error: 'Update failed' }, 500)

  return c.json({ ok: true }, 200)
})

// ─── DELETE /api/comments/:id ─────────────────────────────────────────────────
// Deletes a comment. Only the comment owner or an admin may delete.

router.delete('/:id', async (c) => {
  const user = c.get('user')!
  const id = c.req.param('id')

  const comment = await getCommentById(id)
  if (!comment) return c.json({ error: 'Comment not found' }, 404)
  if (comment.userId !== user.id && user.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await deleteComment(id, comment.userId)
  return c.json({ ok: true }, 200)
})

export default router
