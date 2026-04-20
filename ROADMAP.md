# jblog — Feature Roadmap

## Low effort, high value

- [x] **Tag pages** — `/tag/:slug` filtered post list. Tags are now clickable on cards and post pages.
- [x] **RSS feed** — `/feed.xml` with autodiscovery `<link>` in `<head>`. Last 20 published posts.
- [x] **Pagination** — Home page uses `?page=N` with prev/next navigation. PAGE_SIZE = 6. Hero and featured post shown on page 1 only.
- [x] **Type-safe env config** — Centralized `src/config.ts` that parses and types all env variables at startup. Fail fast on missing required vars.
- [x] **Mobile navbar fix** — Avatar button not clickable on mobile. Replace with a slide-in side menu (mirroring the dashboard sidebar) or a reliable dropdown.
- [x] **Confirm modal on post delete** — Show a confirmation dialog before permanently deleting a post to prevent accidental data loss.
- [x] **Edit button on post page for owner** — When the logged-in user is the post's author, show an "Edit" button at the top of the public post page as a shortcut to the editor.
- [x] **Remove Dashboard link from navbar** — The text link "Dashboard" that appears next to the avatar for verified authors (Navbar.tsx lines 59–66) is redundant; the same link exists inside the avatar dropdown. Remove the standalone link.
- [x] **Changelog: English + fix duplicate title** — Revert the changelog page copy back to English (title, description, footer CTA). Also fix the duplicate heading: the page renders an `<h1>` in JSX *and* CHANGELOG.md opens with `# Changelog`, causing the title to appear twice. Strip the first heading from the rendered markdown or remove the JSX `<h1>`.
- [ ] **Site logo** — Design or source a logo for the site and integrate it into the navbar and favicon.

## Medium effort

- [ ] **Search** — SQLite full-text search (FTS5) on title + excerpt. No external dependencies.
- [ ] **Comment moderation** — admin can delete any comment. Small addition to the admin panel.
- [ ] **"All posts" archive** — sortable/filterable list of all published posts.
- [x] **Auto-create slugs** — Auto-generate slugs for posts from the title in the editor.
- [x] **Changelog page** — Public `/changelog` page listing updates and fixes.
- [ ] **Spanish localisation + rebrand** — Change site language to Spanish. Rename to "Destellos de luz", update all page titles, meta descriptions, UI copy, and logo to reflect the name and Christian theme.
- [ ] **30-day trash for deleted posts** — Soft-delete posts instead of hard-deleting them. Keep them in a trash bin for 30 days so authors can restore accidentally deleted content. Requires a `deleted_at` column, a trash view in the dashboard, and a scheduled cleanup job.
- [x] **Dashboard posts as cards** — Replace the current table layout in `/dashboard` with post cards that match the public postcard look, so authors can preview how their posts will appear. Each card should have a 3-dot context menu with actions: Edit, Publish/Unpublish, Delete.

## Post editor improvements

- [ ] **Preview button** — Add a "Preview" button in the editor toolbar/header that renders the post content as it would appear on the public post page, without saving or leaving the editor.
- [ ] **Remove slug input** — The slug is already auto-generated from the title; remove the manual slug input from the sidebar. Keep the auto-generation logic but stop exposing it as an editable field.
- [ ] **Reduce editor line-height** — The Tiptap editor area currently uses default prose line-height which is larger than what the public post page renders. Adjust the editor's line-height to match the published view so what you see is closer to what readers see.
- [ ] **Redesign post creation page** — Make the editor more minimal and focused on writing. Remove visual noise, keep only essential controls visible. Fix toolbar active-state highlighting so authors can clearly see which formatting is active (bold, italic, etc.). Add H1 to the toolbar — it is currently missing.
- [ ] **Local image upload in editor** — Authors can upload images from their device for inline content and for the cover image, instead of pasting a URL. Requires file storage (e.g. Tigris on Fly.io) — see also *Image upload* below.

## Higher effort

- [ ] **Follow authors + notifications** — Users can follow authors. In-app (and optionally email) notification when a followed author publishes a new post. Requires schema changes (follows table, notifications table).
- [ ] **Account-based likes** — replace IP-based likes with user-session likes so the same reader can like from any device. Requires schema change.
- [ ] **Image upload** — File storage (e.g. Tigris on Fly.io) for author-uploaded images: inline editor images, post cover image, and profile avatar. Currently all three accept only a URL string.
- [ ] **Author management in admin** — list of all authors, ability to revoke or demote.

## Exploration

- [ ] **Move to a universal app architecture (SSR + client-side navigation + Hono RPC)** — The goal is a full SPA feel: no full-page reloads, client-side routing, all data via typed Hono RPC calls. The constraint is that the site is a public blog, so SEO cannot be sacrificed.

  **Why a pure client SPA does not work for this app:**

  A pure SPA serves an empty HTML shell and paints all content with JavaScript. For a blog this breaks SEO in two distinct ways:

  - **Social sharing stops working.** Facebook, Twitter/X, LinkedIn, iMessage, WhatsApp and most other platforms scrape `og:title`, `og:description`, and `og:image` from raw HTML without executing JavaScript. Every shared post link would render a blank card with no title, no image, and no description. This is a hard blocker.
  - **Search indexing becomes unreliable.** Google does execute JavaScript but queues rendering separately from crawling — a new post can sit unrendered in that queue for days or weeks before it is re-indexed. Bing, DuckDuckGo, and other crawlers generally do not execute JavaScript at all. The current JSON-LD `BlogPosting` structured data (which drives Google rich results) would also disappear.

  Dashboard pages (`/dashboard/*`) are `noIndex` and have no social sharing surface, so they are safe to run as a pure client SPA. The problem is exclusively the public routes.

  **The correct architecture — universal / isomorphic:**

  The standard solution — used by Next.js, Nuxt, SvelteKit — is to SSR the first render and hydrate on the client. The server always responds with complete HTML (crawlers and social bots are satisfied), the JS bundle boots and takes over navigation from that point (users get SPA feel on subsequent route changes). No full-page reloads after the first load.

  Hono supports this via SSR streaming and `hydrateRoot` (React) or Hono JSX DOM's own hydration. The key change from the current setup is shipping the component tree to the browser and calling `hydrateRoot` instead of ignoring the server-rendered markup.

  **Split by route surface:**

  | Route group | Rendering strategy | Why |
  |---|---|---|
  | `/`, `/post/:slug`, `/tag/:slug`, `/author/:id` | SSR first load + hydrate | Public, indexed, shared on social |
  | `/dashboard/*`, `/dashboard/post/*` | Pure client SPA | `noIndex`, no social sharing, auth-gated |
  | `/auth/*` | Server redirect flows | No client component needed |

  **What would need to change:**

  1. **Add Zod validators to all mutating routes** (`@hono/zod-validator`). Required for Hono RPC to infer typed inputs. Currently `POST /dashboard/post` and `POST /dashboard/post/:id` parse JSON manually.

  2. **Explicit status codes on all `c.json()` calls.** RPC narrows response types by status code. Replace `c.json(data)` with `c.json(data, 200)` throughout. Replace `c.notFound()` with `c.json({ error: '...' }, 404)`.

  3. **Export `AppType` from the root router** using chained route definitions so TypeScript can infer the full type. Sub-routers need to chain handlers (`.get().post()...`) instead of the current imperative `router.get(...)` style.

  4. **Add an `hcWithType` wrapper** to pre-compute the client type at compile time and avoid IDE slowdown from deep type instantiation:
     ```ts
     // src/client/rpc.ts
     import { hc } from 'hono/client'
     import type { AppType } from '../app'
     export type Client = ReturnType<typeof hc<AppType>>
     export const hcWithType = (...args: Parameters<typeof hc>): Client => hc<AppType>(...args)
     ```

  5. **Replace raw `fetch` in client bundles** (`editor.tsx`, `dashboard.tsx`) with `hcWithType` calls, removing all manual `as SomeType` casts.

  6. **Implement hydration for public routes.** The server renders full HTML as today; the client bundle calls `hydrateRoot` (React) or the Hono JSX DOM equivalent on the same component tree. Requires the component tree to be isomorphic — no `window`/`document` references at module level.

  7. **Add client-side router.** After hydration, link clicks are intercepted and handled client-side. Options: a thin custom router, or a library compatible with Hono JSX DOM. The server must still handle direct URL hits for any route (deep links, refreshes) — it already does.

  **SEO things to preserve through the migration:**
  - `<meta>` tags and OG tags must remain in server-rendered HTML — never set them only via JavaScript.
  - JSON-LD `BlogPosting` script tag must be in the initial HTML response for post pages.
  - `sitemap.xml` and `feed.xml` are already pure server endpoints — no change needed.
  - Add a missing `<link rel="canonical">` to `Shell.tsx` using the `url` field already present in `SeoProps`.

  **Recommended approach — incremental:**
  - Phase 1: RPC foundation — Zod validators, explicit status codes, `AppType` export, `hcWithType`. No client changes yet.
  - Phase 2: Replace `fetch` in `dashboard.tsx` and `editor.tsx` with typed RPC client.
  - Phase 3: Hydration for public routes + client-side router.
  - Phase 4: Evaluate further — data prefetching, streaming, stale-while-revalidate patterns.

  **Constraints:**
  - The more routes under one `AppType`, the heavier `tsserver` gets. Split into `DashboardAppType` and `PublicAppType` if the IDE slows down.
  - `hono-sessions` is transparent to RPC — no changes needed there.
  - The editor bundle uses React; `hc` is framework-agnostic and works in both React and Hono JSX DOM.
