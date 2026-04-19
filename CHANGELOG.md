# Changelog

All notable changes to jblog are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Public `/changelog` page — you are reading it right now.

---

## [1.3.0] — 2026-04-19

### Added
- **Type-safe env config** — `src/config.ts` centralises all `process.env` reads behind typed `required()` / `optional()` helpers. App fails fast at startup when a required variable is missing.
- **Deploy scripts** — `bun run deploy`, `bun run deploy:open`, and `bun run logs` helpers in `package.json`.
- **Auto-slug UX** — The post editor now derives a slug from the title automatically and shows an "Auto" badge. Manually editing the slug overrides it and reveals a "Reset to auto" button.

### Fixed
- **Mobile navbar** — The avatar dropdown was not opening on touch devices. Replaced the broken `group-focus-within` CSS approach with a small inline JS click-toggle. The menu now closes on outside-click and Escape.

---

## [1.2.0] — 2026-04-18

### Added
- **Tag pages** — `/tag/:slug` lists all published posts for a given tag. Tags are now clickable on post cards and post pages.
- **RSS feed** — `/feed.xml` with autodiscovery `<link>` in `<head>`. Includes the 20 most recent published posts.
- **Home pagination** — `?page=N` query parameter with prev/next navigation. Hero and featured post are shown on page 1 only.
- **Copy link button** — One-click clipboard copy on post pages with a transient "Copied!" confirmation.

### Changed
- Extracted shared UI into reusable components: `Avatar`, `TagPill`, `Logo`, `CommentThread`, and a `lib/` utilities directory. Reduces duplication across routes.

### Fixed
- Dashboard layout no longer scrolls the sidebar — only the content area scrolls.
- Entire post card is now clickable (not just the title link).
- Author profile content is correctly centred.
- Author badge styling, removed redundant bottom like button, minor cursor and footer link fixes.

---

## [1.1.0] — 2026-04-18

### Added
- **Threaded comments** — Authenticated users can post top-level comments and reply to any depth. Each thread collapses/expands independently.
- **Author application flow** — Readers can apply to become authors. Admins approve or reject applications with an optional rejection reason.
- **Rejected author flow** — Rejected applicants see their status on the profile page and can re-apply after reading the rejection reason.
- **Account deletion** — Users can permanently delete their account from the profile page (requires confirmation).

### Changed
- Mobile responsive pass: dashboard sidebar, post cards, editor layout, and adaptive padding all adapt to small screens.

### Fixed
- Redirect loop for rejected users resolved.
- Posts nav item is now visible for all roles in the dashboard sidebar.

### Performance
- Lazy-load post cover images.
- Reduced font-weight variants to trim the CSS bundle.
- Syntax highlighting loads only the language grammars actually used.
- CSS fade-in animations, staggered grid entrance, hover-lift on cards, heart pop on likes, AnimatePresence in the editor.

---

## [1.0.0] — 2026-04-18

### Added
- **Foundation** — Hono SSR server with `@hono/react-renderer`, React, TailwindCSS v4, Bun runtime.
- **Public blog** — Home feed, individual post pages, author profile pages.
- **Google OAuth** — Sign-in / sign-out via Google. Session stored in a signed cookie.
- **Author dashboard** — Create, edit, publish, and delete posts. Rich text editing with Tiptap.
- **Admin panel** — Approve / reject author applications. View all users.
- **SQLite + Drizzle ORM** — Schema migrations run automatically on startup. Database persisted on a Fly.io volume.
- **Fly.io deployment** — Dockerised, deployed to the `ams` region.

### Fixed
- Removed real credentials accidentally committed in `.env.example`.
- `arctic` OAuth library: use `decodeIdToken`, fix `deleteCookie` path, redirect to `/` after login.
- Migrations run on startup via `bun:sqlite` migrator to avoid native dependency issues in Docker.
- Replaced `better-sqlite3` with `bun:sqlite` — no native compilation needed in Docker.

---

[Unreleased]: https://github.com/kete102/jblog/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/kete102/jblog/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/kete102/jblog/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/kete102/jblog/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/kete102/jblog/releases/tag/v1.0.0
