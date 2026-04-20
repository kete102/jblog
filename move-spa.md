Architecture after migration
jblog/
├── src/
│ ├── server/ ← Hono API only, no JSX rendering
│ └── client/ ← Vite + React SPA
├── index.html ← Vite entry (replaces Shell.tsx)
└── vite.config.ts
In production, Hono serves the built Vite output for non-API routes. In dev, Vite proxies /api/\* to the Hono server — no CORS needed.

---

Phase 1 — Backend: pure API + Hono RPC [BREAKING]
What changes:

- Remove @hono/react-renderer, React imports, all .tsx route files that render HTML
- Reorganise routes under src/server/routes/api/ — every handler returns JSON only
- Add @hono/zod-validator + Zod schemas to all mutating routes
- Explicit status codes on every c.json() call, c.notFound() → c.json({ error }, 404)
- Chain all handlers so TypeScript can infer the full type tree
- Export AppType from src/server/index.ts
- Add hcWithType wrapper at src/server/rpc.ts
- Add GET /api/me → returns current session user or 401
- Keep sitemap.xml, feed.xml, /auth/google — these must stay server-side
- Add Hono middleware to serve dist/ (built Vite output) for all non-API routes in production
- Add CORS middleware scoped to dev only
  Routes that become pure JSON API:
  Old route New API route
  GET / GET /api/posts?page=N
  GET /post/:slug GET /api/posts/:slug
  GET /tag/:slug GET /api/posts?tag=:slug
  GET /author/:id GET /api/authors/:id
  GET /changelog GET /api/changelog
  POST /post/:slug/like POST /api/posts/:slug/like
  POST /post/:slug/comment POST /api/comments
  POST /post/:slug/comment/:id/edit PUT /api/comments/:id
  POST /post/:slug/comment/:id/delete DELETE /api/comments/:id
  GET /dashboard GET /api/dashboard/posts
  POST /dashboard/post POST /api/dashboard/posts
  POST /dashboard/post/:id PUT /api/dashboard/posts/:id
  POST /dashboard/post/:id/publish POST /api/dashboard/posts/:id/publish
  POST /dashboard/post/:id/delete DELETE /api/dashboard/posts/:id
  New dependencies: @hono/zod-validator, zod  
  Removed dependencies: @hono/react-renderer, marked, dompurify

---

Phase 2 — Build tooling: replace Bun bundler with Vite [BREAKING]
What changes:

- Add vite, @vitejs/plugin-react, @tailwindcss/vite
- Add index.html at root (Vite entry point)
- Add vite.config.ts — proxy /api/\* to Hono in dev, output to dist/
- Update package.json scripts:
  - dev: concurrently 'bun run --hot src/server/index.ts' 'vite'
  - build: vite build && bun run src/server/build.ts (or just vite build)
  - Remove dev:client, remove bun build commands
- Move src/styles/app.css → src/client/styles.css, import inside main.tsx
- Remove @tailwindcss/cli, autoprefixer, postcss
  New dependencies: vite, @vitejs/plugin-react, @tailwindcss/vite  
  Removed dependencies: @tailwindcss/cli, concurrently (or repurposed)

---

Phase 3 — Frontend: TanStack Router + Query scaffold [BREAKING]
What changes:

- Add TanStack Router, TanStack Query, devtools
- Create src/client/main.tsx — createRouter, QueryClient, RouterProvider
- Create src/client/rpc.ts — hcWithType pointing to /api
- Create src/client/query-client.ts
- Enable file-based routing via @tanstack/router-vite-plugin
- Create src/client/routes/\_\_root.tsx — root layout with Navbar + Footer
- Create all route files (empty shells at first, populated in later phases):
  src/client/routes/
  ├── **root.tsx ← Navbar, Footer, Outlet
  ├── index.tsx ← /
  ├── post/
  │ └── $slug.tsx ← /post/:slug
  ├── tag/
  │ └── $slug.tsx ← /tag/:slug
  ├── author/
  │ └── $authorId.tsx ← /author/:authorId
  ├── changelog.tsx ← /changelog
  └── dashboard/
  ├── **layout.tsx ← auth guard (beforeLoad → GET /api/me)
  ├── index.tsx ← /dashboard
  ├── profile.tsx ← /dashboard/profile
  ├── admin.tsx ← /dashboard/admin
  └── post/
  ├── new.tsx ← /dashboard/post/new
  └── $id/
            └── edit.tsx           ← /dashboard/post/$id/edit
- Auth guard pattern using TanStack Router beforeLoad + route context:
  // dashboard/\_\_layout.tsx
  beforeLoad: async ({ context }) => {
  const user = await context.queryClient.fetchQuery(meQuery)
  if (!user) throw redirect({ to: '/auth/login' })
  }

## New dependencies: @tanstack/react-router, @tanstack/router-vite-plugin, @tanstack/react-query, @tanstack/react-query-devtools

Phase 4 — Components: migrate + rebuild [BREAKING]
What changes:

- Port all presentational components (Avatar, AuthorBadge, TagPill, PostCard, Logo, Footer) — minimal changes, just remove server-only imports
- Rebuild Navbar — replace menuScript IIFE with useState dropdown + useEffect click-outside
- Replace lucide-react for all icons (drop the custom SVG icons/index.tsx barrel)
- Build src/client/lib/tiptap-to-jsx.tsx — walks TipTap JSON doc tree recursively and returns JSX elements (no new packages, hand-rolled, replaces tiptapToHtml for the SPA; no dangerouslySetInnerHTML anywhere)
- Extract interactive pieces from post.tsx inline scripts into proper components:
  - LikeButton — useState + useMutation via RPC
  - CommentSection — full thread with reply/edit state via useState + TanStack Query
  - CopyLinkButton — useState for copied flash
- Delete src/components/layout/Shell.tsx (replaced by index.html + \_\_root.tsx)
- Delete src/components/dashboard/DashboardShell.tsx server version — replaced by dashboard/\_\_layout.tsx
- Delete old src/client/editor.tsx and src/client/dashboard.tsx Hono JSX DOM bundles — editor migrates into the Vite app
  Removed dependencies: hono/jsx/dom usage, inline script pattern entirely

---

Phase 5 — Pages: wire data into every route [NOT BREAKING]
What changes (per route):

- index.tsx — useQuery for paginated posts, hero, featured post
- post/$slug.tsx — useQuery for post + comments, LikeButton, CommentSection, CopyLinkButton, post body rendered via tiptapToJsx (walks TipTap JSON tree, returns JSX — no dangerouslySetInnerHTML)
- tag/$slug.tsx — useQuery for posts by tag
- author/$authorId.tsx — useQuery for author + their posts
- changelog.tsx — useQuery for changelog markdown, rendered client-side via marked
- dashboard/index.tsx — reuse the PostCard grid from the Hono JSX DOM bundle we just built
- dashboard/post/new.tsx + edit.tsx — migrate Tiptap editor into Vite app, replace fetch with RPC mutations
- dashboard/profile.tsx, dashboard/admin.tsx — migrate existing forms

---

Phase 6 — SEO mitigation [NOT BREAKING]
Since this is a full SPA, standard crawlers won't see content. Two things we can still do:

- sitemap.xml and feed.xml — already server-generated, stay exactly as-is. Googlebot will discover all URLs via sitemap and attempt to render them.
- Bot metadata endpoint — Add a Hono middleware that detects known crawler user-agents (Googlebot, Twitterbot, facebookexternalhit, etc.) and returns a lightweight HTML response with the correct <title>, <meta description>, and og:\* tags for that URL, but no content body. This solves social sharing without a full SSR implementation.
- TanStack Router head — set <title> dynamically per route for the browser tab and for Google (which does execute JS, just slowly).
  This is a pragmatic middle ground — not full SSR, but social cards will work and Googlebot will have metadata.

---

What stays unchanged throughout

- src/server/db/ — Drizzle schema, migrations, seed — untouched
- src/server/services/ — entire service layer — untouched
- src/server/middleware/auth.ts — untouched
- src/server/config.ts — untouched
- hono-sessions — session cookies work transparently with a SPA
- /sitemap.xml, /feed.xml, /auth/google — stay server-rendered

---

PR order

# Branch

1 refactor/api-only-backend
2 refactor/vite-build
3 refactor/tanstack-router-scaffold
4 refactor/component-migration
5 feat/wire-all-pages
6 feat/seo-bot-middleware
