import { Hono } from 'hono'
import postsRouter from './posts'
import profileRouter from './profile'
import adminRouter from './admin'
import becomeAuthorRouter from './become-author'

// ─── /api/dashboard ───────────────────────────────────────────────────────────
// All dashboard sub-routes require at least auth — individual routers apply
// their own role guards (author, admin) where needed.

const router = new Hono()

router.route('/posts', postsRouter)
router.route('/profile', profileRouter)
router.route('/admin', adminRouter)
router.route('/become-author', becomeAuthorRouter)

export default router
