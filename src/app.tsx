import { Hono } from 'hono'
import { reactRenderer } from '@hono/react-renderer'
import { serveStatic } from 'hono/bun'
import React from 'react'

import Shell from '@/components/layout/Shell'
import { userMiddleware } from '@/middleware/auth'
import authRouter from '@/routes/auth/google'
import homeRouter from '@/routes/public/home'
import postRouter from '@/routes/public/post'
import authorRouter from '@/routes/public/author'
import sitemapRouter from '@/routes/public/sitemap'
import dashboardRouter from '@/routes/dashboard'
import dashboardPostRouter from '@/routes/dashboard/post'
import dashboardProfileRouter from '@/routes/dashboard/profile'
import dashboardAdminRouter from '@/routes/dashboard/admin'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const app = new Hono()

// ─── Static assets ────────────────────────────────────────────────────────────

app.use('/styles.css', serveStatic({ path: './public/styles.css' }))
app.use('/js/*', serveStatic({ root: './public' }))
app.use('/images/*', serveStatic({ root: './public' }))
app.use('/favicon.svg', serveStatic({ path: './public/favicon.svg' }))

// ─── React SSR renderer ───────────────────────────────────────────────────────

app.use(
  '*',
  reactRenderer(
    ({ children, seo, clientBundle }) => (
      <Shell seo={seo} clientBundle={clientBundle}>
        {children}
      </Shell>
    ),
    { stream: false },
  ),
)

// ─── Attach user to all requests ─────────────────────────────────────────────

app.use('*', userMiddleware)

// ─── Auth routes ─────────────────────────────────────────────────────────────

app.route('/auth', authRouter)

// ─── Public routes ───────────────────────────────────────────────────────────

app.route('/', homeRouter)
app.route('/post', postRouter)
app.route('/author', authorRouter)
app.route('/', sitemapRouter)

// ─── Dashboard routes ────────────────────────────────────────────────────────

app.route('/dashboard', dashboardRouter)
app.route('/dashboard/post', dashboardPostRouter)
app.route('/dashboard/profile', dashboardProfileRouter)
app.route('/dashboard/admin', dashboardAdminRouter)

// ─── Pending approval page (signed-in + pending role only) ───────────────────

app.get('/pending', (c) => {
  const user = c.get('user')

  // Not signed in → send to home
  if (!user) return c.redirect('/')
  // Already approved → send to dashboard
  if (user.role !== 'pending') return c.redirect('/dashboard')

  return c.render(
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6 text-3xl">
            ⏳
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-3">
            Awaiting approval
          </h1>
          <p className="text-zinc-500 leading-relaxed mb-8">
            Your account has been created and is waiting for an admin to approve it.
            You'll be able to write and publish posts once approved.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Back to blog
          </a>
        </div>
      </main>
      <Footer />
    </div>,
    { seo: { title: 'Awaiting Approval', noIndex: true } },
  )
})

// ─── 404 ─────────────────────────────────────────────────────────────────────

app.notFound((c) => {
  const user = c.get('user')
  c.status(404)

  return c.render(
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-8xl font-black text-zinc-100 mb-4">404</p>
          <h1 className="text-2xl font-bold text-zinc-900 mb-3">Page not found</h1>
          <p className="text-zinc-500 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Back to home
          </a>
        </div>
      </main>
      <Footer />
    </div>,
    { seo: { title: '404 — Page not found', noIndex: true } },
  )
})

export default app
