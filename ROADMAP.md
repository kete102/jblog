# jblog — Feature Roadmap

## Low effort, high value

- [x] **Tag pages** — `/tag/:slug` filtered post list. Tags are now clickable on cards and post pages.
- [x] **RSS feed** — `/feed.xml` with autodiscovery `<link>` in `<head>`. Last 20 published posts.
- [x] **Pagination** — Home page uses `?page=N` with prev/next navigation. PAGE_SIZE = 6. Hero and featured post shown on page 1 only.
- [x] **Type-safe env config** — Centralized `src/config.ts` that parses and types all env variables at startup. Fail fast on missing required vars.
- [x] **Mobile navbar fix** — Avatar button not clickable on mobile. Replace with a slide-in side menu (mirroring the dashboard sidebar) or a reliable dropdown.

## Medium effort

- [ ] **Search** — SQLite full-text search (FTS5) on title + excerpt. No external dependencies.
- [ ] **Comment moderation** — admin can delete any comment. Small addition to the admin panel.
- [ ] **"All posts" archive** — sortable/filterable list of all published posts.
- [x] **Auto-create slugs** — Auto-generate slugs for posts from the title in the editor.
  - [x] **Changelog page** — Public `/changelog` page listing updates and fixes. Authenticated users can submit feature requests or bug reports directly from the page.

## Higher effort

- [ ] **Follow authors + notifications** — Users can follow authors. In-app (and optionally email) notification when a followed author publishes a new post. Requires schema changes (follows table, notifications table).
- [ ] **Account-based likes** — replace IP-based likes with user-session likes so the same reader can like from any device. Requires schema change.
- [ ] **Image upload** — cover image is currently a URL string. Would need file storage (e.g. Tigris on Fly.io).
- [ ] **Author management in admin** — list of all authors, ability to revoke or demote.
