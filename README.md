# jblog

An independent blogging platform. Authors apply to write, readers can comment and like posts. Built with Bun, Hono, React, and TailwindCSS.

## Environments

| Environment | URL | Branch |
|---|---|---|
| Production | https://destellos-de-fe.fly.dev | `main` |
| Staging | https://destellos-de-fe-staging.fly.dev | `staging` |

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Server / SSR | Hono + `@hono/react-renderer` |
| Frontend | React 19 + TailwindCSS v4 |
| Rich text editor | Tiptap |
| Database | SQLite via `bun:sqlite` + Drizzle ORM |
| Auth | Google OAuth via Arctic |
| Deployment | Fly.io — Docker, region `ams` |

## Local development

### Prerequisites

- [Bun](https://bun.sh) >= 1.x
- A [Google OAuth app](https://console.cloud.google.com) with `http://localhost:3000/auth/google/callback` as an authorised redirect URI

### Setup

1. Install dependencies:

   ```sh
   bun install
   ```

2. Copy the env file and fill in the required values:

   ```sh
   cp .env.example .env
   ```

3. Required environment variables:

   | Variable | Description |
   |---|---|
   | `BASE_URL` | Full origin (e.g. `http://localhost:3000`) |
   | `DATABASE_URL` | Path to the SQLite file (e.g. `./jblog.db`) |
   | `GOOGLE_CLIENT_ID` | Google OAuth client ID |
   | `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
   | `ADMIN_EMAIL` | Google account email that receives `admin` role on first sign-in |
   | `SESSION_SECRET` | Random string — at least 32 characters |

   Optional S3/R2 variables (`S3_ENDPOINT`, `S3_BUCKET`, etc.) enable image upload. The app runs fine without them.

4. Start the dev server:

   ```sh
   bun run dev
   ```

   This runs the Hono server, CSS watcher, and client bundle watcher in parallel. Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
├── app.tsx                  # Hono app — route mounting, renderer, middleware
├── index.ts                 # Entry point — runs migrations, starts server
├── config.ts                # Type-safe env config (single source of truth)
├── types.d.ts               # Global TypeScript declarations
│
├── client/
│   └── editor.tsx           # Client-side Tiptap editor (bundled separately)
│
├── components/
│   ├── blog/                # PostCard, Avatar, TagPill, CommentThread, AuthorBadge
│   ├── dashboard/           # DashboardShell layout
│   ├── icons/               # Custom SVG icon components
│   └── layout/              # Shell, Navbar, Footer, Logo
│
├── db/
│   ├── schema.ts            # Drizzle schema definition
│   ├── migrations/          # Auto-generated SQL migrations
│   ├── seed.ts              # Dev seed data
│   └── migrate.ts           # Standalone migration runner
│
├── lib/                     # Shared utilities: session, seo, format, roles, tiptap, request
├── middleware/
│   └── auth.ts              # Attaches authenticated user to every request context
│
├── routes/
│   ├── auth/
│   │   └── google.ts        # Google OAuth callback
│   ├── public/              # home, post, author, tag, changelog, rss, sitemap
│   └── dashboard/           # index, post editor, profile, admin, become-author
│
├── services/                # Data-access layer: posts, users, engagement
└── styles/
    └── app.css              # TailwindCSS v4 entry (typography plugin included)
```

## Database

Schema is defined in `src/db/schema.ts`.

**Tables:** `users`, `posts`, `tags`, `post_tags`, `post_likes`, `comments`, `author_requests`, `sessions`

Migrations run automatically on every server startup. To create a new migration after editing the schema:

```sh
bun run db:generate   # generates SQL in src/db/migrations/
bun run db:migrate    # applies it locally
```

## Scripts

| Script | Description |
|---|---|
| `bun run dev` | Server + CSS watcher + client bundle watcher (parallel) |
| `bun run build` | Production CSS + client bundle (minified) |
| `bun run deploy` | Deploy to production |
| `bun run deploy:staging` | Deploy to staging |
| `bun run deploy:open` | Open production app in browser |
| `bun run deploy:staging:open` | Open staging app in browser |
| `bun run logs` | Tail production logs |
| `bun run logs:staging` | Tail staging logs |
| `bun run db:generate` | Generate a Drizzle migration from schema changes |
| `bun run db:migrate` | Apply pending migrations locally |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run db:seed` | Seed the local database with sample data |

## Deployment

The app runs in Docker on Fly.io. SQLite is persisted on a mounted volume (`/data/jblog.db`).

- Production config: `fly.toml`
- Staging config: `fly.staging.toml`

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full branching and release workflow.

## Links

- [Changelog](https://destellos-de-fe.fly.dev/changelog)
- [Roadmap](./ROADMAP.md)
- [Contributing](./CONTRIBUTING.md)
