# jblog — Feature Roadmap

## Low effort, high value

- [x] **Tag pages** — `/tag/:slug` filtered post list. Tags are now clickable on cards and post pages.
- [x] **RSS feed** — `/feed.xml` with autodiscovery `<link>` in `<head>`. Last 20 published posts.
- [x] **Pagination** — Home page uses `?page=N` with prev/next navigation. PAGE_SIZE = 6. Hero and featured post shown on page 1 only.
- [x] **Type-safe env config** — Centralized `src/config.ts` that parses and types all env variables at startup. Fail fast on missing required vars.
- [x] **Mobile navbar fix** — Avatar button not clickable on mobile. Replace with a slide-in side menu (mirroring the dashboard sidebar) or a reliable dropdown.
- [x] **Confirm modal on post delete** — Show a confirmation dialog before permanently deleting a post to prevent accidental data loss.
- [x] **Edit button on post page for owner** — When the logged-in user is the post's author, show an "Edit" button at the top of the public post page as a shortcut to the editor.
- [x] **Remove Dashboard link from navbar** — The text link "Dashboard" that appeared next to the avatar for verified authors was redundant; the same link exists inside the avatar dropdown.
- [x] **Changelog: English + fix duplicate title** — Reverted changelog copy back to English and stripped the leading `# Changelog` heading from the rendered markdown to prevent the title appearing twice.
- [ ] **Site logo** — Design or source a logo for the site and integrate it into the navbar and favicon.

## Medium effort

- [ ] **Search** — SQLite full-text search (FTS5) on title + excerpt. No external dependencies.
- [ ] **Comment moderation** — admin can delete any comment. Small addition to the admin panel.
- [ ] **"All posts" archive** — sortable/filterable list of all published posts.
- [x] **Auto-create slugs** — Auto-generate slugs for posts from the title in the editor.
- [x] **Changelog page** — Public `/changelog` page listing updates and fixes.
- [ ] **Spanish localisation + rebrand** — Change site language to Spanish. Rename to "Destellos de luz", update all page titles, meta descriptions, UI copy, and logo to reflect the name and Christian theme.
- [ ] **30-day trash for deleted posts** — Soft-delete posts instead of hard-deleting them. Keep them in a trash bin for 30 days so authors can restore accidentally deleted content. Requires a `deleted_at` column, a trash view in the dashboard, and a scheduled cleanup job.
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
