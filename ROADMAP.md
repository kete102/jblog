# jblog — Feature Roadmap

## Low effort, high value

- [x] **Tag pages** — `/tag/:slug` filtered post list. Tags are now clickable on cards and post pages.
- [x] **RSS feed** — `/feed.xml` with autodiscovery `<link>` in `<head>`. Last 20 published posts.
- [x] **Pagination** — Home page uses `?page=N` with prev/next navigation. PAGE_SIZE = 6. Hero and featured post shown on page 1 only.
- [x] **Type-safe env config** — Centralized `src/config.ts` that parses and types all env variables at startup. Fail fast on missing required vars.
- [x] **Mobile navbar fix** — Avatar button not clickable on mobile. Replace with a slide-in side menu (mirroring the dashboard sidebar) or a reliable dropdown.
- [ ] **Remove Dashboard link from navbar** — The text link "Dashboard" that appears next to the avatar for verified authors (Navbar.tsx lines 59–66) is redundant; the same link exists inside the avatar dropdown. Remove the standalone link.
- [x] **Changelog: English + fix duplicate title** — Revert the changelog page copy back to English (title, description, footer CTA). Also fix the duplicate heading: the page renders an `<h1>` in JSX *and* CHANGELOG.md opens with `# Changelog`, causing the title to appear twice. Strip the first heading from the rendered markdown or remove the JSX `<h1>`.

## Medium effort

- [ ] **Search** — SQLite full-text search (FTS5) on title + excerpt. No external dependencies.
- [ ] **Comment moderation** — admin can delete any comment. Small addition to the admin panel.
- [ ] **"All posts" archive** — sortable/filterable list of all published posts.
- [x] **Auto-create slugs** — Auto-generate slugs for posts from the title in the editor.
- [x] **Changelog page** — Public `/changelog` page listing updates and fixes.
- [ ] **Spanish localisation + rebrand** — Change site language to Spanish. Rename to "Destellos de luz", update all page titles, meta descriptions, UI copy, and logo to reflect the name and Christian theme.
- [ ] **Dashboard posts as cards** — Replace the current table layout in `/dashboard` with post cards that match the public postcard look, so authors can preview how their posts will appear. Each card should have a 3-dot context menu with actions: Edit, Publish/Unpublish, Delete.

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
