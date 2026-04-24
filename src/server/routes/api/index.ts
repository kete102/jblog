import { Hono } from 'hono'
import meRouter from './me'
import postsRouter from './posts'
import authorsRouter from './authors'
import tagsRouter from './tags'
import changelogRouter from './changelog'
import commentsRouter from './comments'
import dashboardRouter from './dashboard'

// ─── /api ─────────────────────────────────────────────────────────────────────
// All public and authenticated API routes are aggregated here.
// The router is mounted at /api in src/server/index.ts.

const router = new Hono()

router.route('/me', meRouter)
router.route('/posts', postsRouter)
router.route('/authors', authorsRouter)
router.route('/tags', tagsRouter)
router.route('/changelog', changelogRouter)
router.route('/comments', commentsRouter)
router.route('/dashboard', dashboardRouter)

export default router
