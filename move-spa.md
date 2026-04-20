# 🚀 JBlog Migration Plan

## 🧱 Final Architecture

```
jblog/
├── src/
│   ├── server/   # Hono API only (no JSX rendering)
│   └── client/   # Vite + React SPA
├── index.html    # Vite entry (replaces Shell.tsx)
└── vite.config.ts
```

**Runtime behavior:**

* **Production:** Hono serves built Vite output for non-API routes
* **Development:** Vite proxies `/api/*` → Hono (no CORS needed)

---

# 🧩 Phase 1 — Backend: Pure API + Hono RPC ⚠️ BREAKING

## 🔧 Changes

* Remove:

  * `@hono/react-renderer`
  * All React imports
  * All `.tsx` route files rendering HTML

* Reorganize routes:

  ```
  src/server/routes/api/
  ```

* Enforce API standards:

  * JSON-only responses
  * Use `@hono/zod-validator` + Zod schemas
  * Explicit status codes:

    ```ts
    c.json(data, 200)
    c.json({ error }, 404)
    ```

* Type safety:

  * Chain handlers for full inference
  * Export `AppType` from `src/server/index.ts`

* RPC:

  * Add `hcWithType` → `src/server/rpc.ts`

* New endpoint:

  * `GET /api/me` → current user or `401`

* Middleware:

  * Serve `dist/` in production
  * Dev-only CORS

## 🔁 Route Migration

| Old Route                             | New API Route                           |
| ------------------------------------- | --------------------------------------- |
| `/`                                   | `/api/posts?page=N`                     |
| `/post/:slug`                         | `/api/posts/:slug`                      |
| `/tag/:slug`                          | `/api/posts?tag=:slug`                  |
| `/author/:id`                         | `/api/authors/:id`                      |
| `/changelog`                          | `/api/changelog`                        |
| `POST /post/:slug/like`               | `POST /api/posts/:slug/like`            |
| `POST /post/:slug/comment`            | `POST /api/comments`                    |
| `POST /post/:slug/comment/:id/edit`   | `PUT /api/comments/:id`                 |
| `POST /post/:slug/comment/:id/delete` | `DELETE /api/comments/:id`              |
| `/dashboard`                          | `/api/dashboard/posts`                  |
| `POST /dashboard/post`                | `POST /api/dashboard/posts`             |
| `POST /dashboard/post/:id`            | `PUT /api/dashboard/posts/:id`          |
| `POST /dashboard/post/:id/publish`    | `POST /api/dashboard/posts/:id/publish` |
| `POST /dashboard/post/:id/delete`     | `DELETE /api/dashboard/posts/:id`       |

## 📦 Dependencies

* ➕ `@hono/zod-validator`, `zod`
* ➖ `@hono/react-renderer`, `marked`, `dompurify`

---

# ⚙️ Phase 2 — Build Tooling: Vite Migration ⚠️ BREAKING

## 🔧 Changes

* Add:

  * `vite`
  * `@vitejs/plugin-react`
  * `@tailwindcss/vite`

* New files:

  * `index.html`
  * `vite.config.ts`

* Dev proxy:

  * `/api/*` → Hono
  * Output → `dist/`

## 📜 Scripts

```json
{
  "dev": "concurrently 'bun run --hot src/server/index.ts' 'vite'",
  "build": "vite build"
}
```

* Remove:

  * `dev:client`
  * Bun build commands

## 🎨 Styles

* Move:

  ```
  src/styles/app.css → src/client/styles.css
  ```

* Import in `main.tsx`

## 📦 Dependencies

* ➕ `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`
* ➖ `@tailwindcss/cli`, `autoprefixer`, `postcss`

---

# 🧭 Phase 3 — Frontend: TanStack Router + Query ⚠️ BREAKING

## 🔧 Setup

* Add:

  * TanStack Router
  * TanStack Query
  * Devtools

## 🗂 Structure

```
src/client/
├── main.tsx
├── rpc.ts
├── query-client.ts
└── routes/
```

## 🧱 Routes

```
routes/
├── __root.tsx
├── index.tsx
├── post/$slug.tsx
├── tag/$slug.tsx
├── author/$authorId.tsx
├── changelog.tsx
└── dashboard/
    ├── __layout.tsx
    ├── index.tsx
    ├── profile.tsx
    ├── admin.tsx
    └── post/
        ├── new.tsx
        └── $id/edit.tsx
```

## 🔐 Auth Guard

```ts
beforeLoad: async ({ context }) => {
  const user = await context.queryClient.fetchQuery(meQuery)
  if (!user) throw redirect({ to: '/auth/login' })
}
```

## 📦 Dependencies

* `@tanstack/react-router`
* `@tanstack/router-vite-plugin`
* `@tanstack/react-query`
* `@tanstack/react-query-devtools`

---

# 🧩 Phase 4 — Components Migration ⚠️ BREAKING

## 🔧 Changes

* Port presentational components
* Rebuild Navbar (state-driven)
* Replace icons → `lucide-react`

## ✨ New Utilities

* `tiptap-to-jsx.tsx` (no `dangerouslySetInnerHTML`)

## 🧠 Extracted Components

* `LikeButton`
* `CommentSection`
* `CopyLinkButton`

## 🗑 Removed

* `Shell.tsx`
* Server dashboard shell
* Inline script patterns
* Hono JSX DOM bundles

---

# 📄 Phase 5 — Pages Wiring ✅ NOT BREAKING

## 🔌 Data Integration

* `index.tsx` → paginated posts
* `post/$slug.tsx` → post + comments
* `tag/$slug.tsx` → posts by tag
* `author/$authorId.tsx` → author data
* `changelog.tsx` → markdown via `marked`
* `dashboard/*` → full migration to SPA

---

# 🔍 Phase 6 — SEO Mitigation ✅ NOT BREAKING

## 🛠 Strategy

* Keep:

  * `sitemap.xml`
  * `feed.xml`

* Add:

  * Bot detection middleware
  * Lightweight HTML metadata responses

* Dynamic `<title>` via TanStack Router

---

# 🧬 Unchanged Areas

* `src/server/db/`
* `src/server/services/`
* `auth.ts`
* `config.ts`
* Sessions (`hono-sessions`)
* `/sitemap.xml`, `/feed.xml`, `/auth/google`

---

# 🌿 PR Order

| # | Branch                              |
| - | ----------------------------------- |
| 1 | `refactor/api-only-backend`         |
| 2 | `refactor/vite-build`               |
| 3 | `refactor/tanstack-router-scaffold` |
| 4 | `refactor/component-migration`      |
| 5 | `feat/wire-all-pages`               |
| 6 | `feat/seo-bot-middleware`           |

---

💡 *Goal: Fully decoupled SPA + type-safe API with excellent DX and scalable architecture.*
