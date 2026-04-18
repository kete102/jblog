# jblog — Feature Roadmap

## Low effort, high value

- [x] **Tag pages** — `/tag/:slug` filtered post list. Tags are now clickable on cards and post pages.
- [x] **RSS feed** — `/feed.xml` with autodiscovery `<link>` in `<head>`. Last 20 published posts.
- [x] **Pagination** — Home page uses `?page=N` with prev/next navigation. PAGE_SIZE = 6. Hero and featured post shown on page 1 only.

## Medium effort

- [ ] **Search** — SQLite full-text search (FTS5) on title + excerpt. No external dependencies.
- [ ] **Comment moderation** — admin can delete any comment. Small addition to the admin panel.
- [ ] **"All posts" archive** — sortable/filterable list of all published posts.
- [ ] Auto-create slugs for posts

## Higher effort

- [ ] **Account-based likes** — replace IP-based likes with user-session likes so the same reader can like from any device. Requires schema change.
- [ ] **Image upload** — cover image is currently a URL string. Would need file storage (e.g. Tigris on Fly.io).
- [ ] **Author management in admin** — list of all authors, ability to revoke or demote.
