/**
 * Seed the database with mock authors, tags, and blog posts.
 * Run with: bun run db:seed
 */
import { db } from './index'
import { users, posts, tags, postTags } from './schema'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const id = () => crypto.randomUUID()

function makeDoc(...paragraphs: unknown[]) {
  return { type: 'doc', content: paragraphs }
}

function h2(text: string) {
  return { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] }
}

function p(...items: unknown[]) {
  return { type: 'paragraph', content: items }
}

function t(text: string, ...marks: { type: string; attrs?: Record<string, unknown> }[]) {
  return marks.length ? { type: 'text', text, marks } : { type: 'text', text }
}

function bold(text: string) {
  return t(text, { type: 'bold' })
}

function italic(text: string) {
  return t(text, { type: 'italic' })
}

function ul(...items: string[]) {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [p(t(item))],
    })),
  }
}

function blockquote(text: string) {
  return { type: 'blockquote', content: [p(t(text))] }
}

function code(lang: string, code: string) {
  return {
    type: 'codeBlock',
    attrs: { language: lang },
    content: [{ type: 'text', text: code }],
  }
}

// ─── Authors ──────────────────────────────────────────────────────────────────

const AUTHOR_1_ID = id()
const AUTHOR_2_ID = id()
const AUTHOR_3_ID = id()

const mockAuthors = [
  {
    id: AUTHOR_1_ID,
    name: 'Alex Rivera',
    email: 'alex@example.com',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=alex&backgroundColor=b6e3f4',
    bio: 'Staff engineer at a fintech startup. Writes about distributed systems, TypeScript, and building things that last.',
    socialLinks: {
      twitter: 'https://twitter.com',
      github: 'https://github.com',
      website: 'https://example.com',
    },
    role: 'author' as const,
    publishedPostCount: 3,
  },
  {
    id: AUTHOR_2_ID,
    name: 'Mia Chen',
    email: 'mia@example.com',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=mia&backgroundColor=ffd5dc',
    bio: 'Product designer turned front-end engineer. Obsessed with CSS, accessibility, and delightful micro-interactions.',
    socialLinks: { twitter: 'https://twitter.com', github: 'https://github.com' },
    role: 'author' as const,
    publishedPostCount: 2,
  },
  {
    id: AUTHOR_3_ID,
    name: 'Sam Torres',
    email: 'sam@example.com',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=sam&backgroundColor=c0aede',
    bio: 'Indie hacker building developer tools. Former backend lead. Avid coffee drinker.',
    socialLinks: { github: 'https://github.com' },
    role: 'author' as const,
    publishedPostCount: 2,
  },
]

// ─── Tags ─────────────────────────────────────────────────────────────────────

const TAG_TS_ID = id()
const TAG_PERF_ID = id()
const TAG_CSS_ID = id()
const TAG_BUN_ID = id()
const TAG_DX_ID = id()
const TAG_DESIGN_ID = id()

const mockTags = [
  { id: TAG_TS_ID, name: 'TypeScript', slug: 'typescript' },
  { id: TAG_PERF_ID, name: 'Performance', slug: 'performance' },
  { id: TAG_CSS_ID, name: 'CSS', slug: 'css' },
  { id: TAG_BUN_ID, name: 'Bun', slug: 'bun' },
  { id: TAG_DX_ID, name: 'Developer Experience', slug: 'developer-experience' },
  { id: TAG_DESIGN_ID, name: 'Design', slug: 'design' },
]

// ─── Posts ────────────────────────────────────────────────────────────────────

const POST_1_ID = id()
const POST_2_ID = id()
const POST_3_ID = id()
const POST_4_ID = id()
const POST_5_ID = id()
const POST_6_ID = id()
const POST_7_ID = id()

const now = new Date()
function daysAgo(n: number) {
  return new Date(now.getTime() - n * 86_400_000)
}

const mockPosts = [
  {
    id: POST_1_ID,
    slug: 'why-bun-is-the-future-of-javascript-tooling',
    title: 'Why Bun Is the Future of JavaScript Tooling',
    excerpt:
      "Bun is more than just a fast runtime — it's a complete rethink of what a JavaScript toolchain should feel like. Here's why I've moved all my projects over.",
    coverImageUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&q=80',
    authorId: AUTHOR_3_ID,
    status: 'published' as const,
    publishedAt: daysAgo(2),
    views: 3_812,
    likes: 214,
    readingTimeMinutes: 6,
    content: makeDoc(
      p(
        t(
          "I switched my last three projects from Node.js + Webpack to Bun. I'm not going back. Here's what changed my mind.",
        ),
      ),
      h2("It's not just fast — it's "), // partial
      p(
        bold('Fast'),
        t(
          " doesn't begin to cover it. Bun starts in under 10ms, installs packages 10–25× faster than npm, and runs TypeScript natively without a build step. But the real unlock is that it's all ",
        ),
        italic('one tool'),
        t('.'),
      ),
      blockquote('The best tooling is the tooling you forget is there.'),
      h2('Native TypeScript support'),
      p(
        t('No more '),
        t('ts-node', { type: 'code' }),
        t(', no more '),
        t('tsc --watch', { type: 'code' }),
        t(' in a separate terminal. Bun reads your '),
        t('tsconfig.json', { type: 'code' }),
        t(" and just runs your code. It's the workflow TypeScript always deserved."),
      ),
      code(
        'bash',
        `# Before (Node.js)
npx ts-node src/index.ts

# After (Bun)
bun run src/index.ts`,
      ),
      h2('A complete toolkit'),
      p(
        t(
          "Bun ships a bundler, test runner, package manager, and shell scripting API out of the box. That's four tools replaced by one binary. Your ",
        ),
        t('package.json', { type: 'code' }),
        t(' gets dramatically simpler.'),
      ),
      ul(
        'bun install — package manager (no node_modules drama)',
        'bun build — bundler with tree-shaking',
        'bun test — Jest-compatible test runner',
        'Bun.serve() — HTTP server with 0 overhead',
      ),
      h2('The migration path is gentle'),
      p(
        t(
          'Bun is Node.js-compatible by design. Most npm packages work without changes. You can adopt it incrementally — start with just ',
        ),
        t('bun install', { type: 'code' }),
        t(' for the speed win, then migrate your scripts one by one.'),
      ),
      p(
        t(
          "If you're starting a new project in 2025, there's no reason to reach for anything else.",
        ),
      ),
    ),
  },
  {
    id: POST_2_ID,
    slug: 'the-typescript-patterns-i-use-every-day',
    title: 'The TypeScript Patterns I Use Every Day',
    excerpt:
      'After five years of writing TypeScript professionally, a handful of patterns have become second nature. These are the ones I reach for on every project.',
    coverImageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80',
    authorId: AUTHOR_1_ID,
    status: 'published' as const,
    publishedAt: daysAgo(5),
    views: 5_640,
    likes: 389,
    readingTimeMinutes: 8,
    content: makeDoc(
      p(
        t(
          'TypeScript can be a joy or a nightmare, depending entirely on how you use it. These are the patterns that keep me on the right side of that line.',
        ),
      ),
      h2('1. Discriminated unions over boolean flags'),
      p(
        t(
          'Instead of a growing pile of optional booleans, model your state as a union of distinct shapes. The exhaustiveness check pays for itself on the first refactor.',
        ),
      ),
      code(
        'typescript',
        `// ❌ Don't
type Request = {
  loading: boolean
  error?: string
  data?: User
}

// ✅ Do
type Request =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: User }`,
      ),
      h2('2. The satisfies operator'),
      p(
        t('Introduced in TypeScript 4.9, '),
        bold('satisfies'),
        t(
          ' lets you validate a value against a type without widening it. Perfect for config objects where you want inference ',
        ),
        italic('and'),
        t(' safety.'),
      ),
      code(
        'typescript',
        `const config = {
  port: 3000,
  host: 'localhost',
} satisfies ServerConfig

// config.port is still \`number\`, not \`ServerConfig['port']\`
`,
      ),
      h2('3. Template literal types for string safety'),
      p(
        t(
          'Stop using raw strings for event names, route paths, and CSS class prefixes. Template literal types turn stringly-typed code into something the compiler can actually check.',
        ),
      ),
      code(
        'typescript',
        `type Route = \`/\${string}\`
type EventName = \`on\${Capitalize<string>}\`

function navigate(route: Route) { /* ... */ }

navigate('/users/123')  // ✅
navigate('users/123')   // ❌ Type error`,
      ),
      h2('4. infer in conditional types'),
      p(
        t('Once you understand '),
        t('infer', { type: 'code' }),
        t(', a whole class of utility types becomes writable by hand. The '),
        t('Awaited<T>', { type: 'code' }),
        t(' built-in is a famous example.'),
      ),
      blockquote(
        'Types are documentation that the compiler can enforce. Write them like you mean it.',
      ),
      h2('5. Const assertions for literal inference'),
      p(
        t(
          'When you want a value to be inferred as its literal type rather than widened, reach for ',
        ),
        t('as const', { type: 'code' }),
        t('. Especially useful for lookup maps and route definitions.'),
      ),
    ),
  },
  {
    id: POST_3_ID,
    slug: 'css-that-doesnt-fight-you',
    title: "CSS That Doesn't Fight You",
    excerpt:
      "Most CSS problems aren't CSS problems — they're architecture problems. A few mental models that transformed how I write styles.",
    coverImageUrl: 'https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19?w=1200&q=80',
    authorId: AUTHOR_2_ID,
    status: 'published' as const,
    publishedAt: daysAgo(9),
    views: 2_177,
    likes: 143,
    readingTimeMinutes: 5,
    content: makeDoc(
      p(
        t(
          "Every developer has a CSS horror story. A style leaking across components. A z-index arms race that ends at 9999. A padding that fixes desktop but breaks mobile. Most of these aren't caused by CSS being bad — they're caused by CSS being written without a model.",
        ),
      ),
      h2('The cascade is a feature, not a bug'),
      p(
        t('The cascade exists to resolve conflicts. When you fight it with '),
        t('!important', { type: 'code' }),
        t(
          " and hyper-specific selectors, you're not solving the problem — you're deferring it. Instead, ",
        ),
        bold('design your specificity intentionally'),
        t('.'),
      ),
      p(
        t(
          "Use Tailwind's utility classes, CSS custom properties, or BEM — but pick one and commit. The worst codebases mix all three without rules.",
        ),
      ),
      h2('Layout is a separate concern from decoration'),
      p(
        t('I split my CSS into two mental buckets: '),
        bold('layout'),
        t(' (how things are positioned and sized) and '),
        bold('decoration'),
        t(
          ' (colors, fonts, shadows). These change for different reasons and should live in different places.',
        ),
      ),
      ul(
        'Layout: flexbox, grid, margin, padding, width, position',
        'Decoration: color, background, border, shadow, opacity',
        'Never mix them in the same selector if you can help it',
      ),
      h2('Name things by what they are, not how they look'),
      p(
        t('A class called '),
        t('text-blue', { type: 'code' }),
        t(' breaks the moment your brand color changes to green. '),
        t('text-primary', { type: 'code' }),
        t(
          " never needs to change. This sounds obvious, but it's violated in almost every large codebase I've seen.",
        ),
      ),
      blockquote(
        '"Make it easy to delete" is the most underrated principle in software design. It applies to CSS more than anywhere else.',
      ),
      h2('TailwindCSS and the end of naming'),
      p(
        t("The reason Tailwind won isn't the bundle size or the performance. It's that "),
        italic('it removes the hardest part of CSS: naming things'),
        t(
          ". When every style is a utility class, there's nothing to name, nothing to scope, and nothing to accidentally override.",
        ),
      ),
    ),
  },
  {
    id: POST_4_ID,
    slug: 'building-fast-apis-with-hono',
    title: 'Building Fast APIs with Hono',
    excerpt:
      "Hono is the web framework I've been waiting for: tiny, type-safe, edge-ready, and brutally fast. Here's how to get the most out of it.",
    coverImageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80',
    authorId: AUTHOR_1_ID,
    status: 'published' as const,
    publishedAt: daysAgo(14),
    views: 4_301,
    likes: 271,
    readingTimeMinutes: 7,
    content: makeDoc(
      p(
        t(
          "I've used Express, Fastify, Koa, and a handful of edge-native frameworks. Hono is the first one that makes me feel like the framework is working ",
        ),
        italic('with'),
        t(' me rather than around me.'),
      ),
      h2('Why Hono?'),
      ul(
        'Zero dependencies',
        'First-class TypeScript with end-to-end type safety',
        'Works on Bun, Node.js, Cloudflare Workers, Deno',
        'Middleware is composable and testable',
        'Fast — measurably, not just in benchmarks',
      ),
      h2('Type-safe routing'),
      p(
        t(
          "Hono's RPC client is its killer feature. Define your routes with types, and your frontend client gets full type inference automatically — no OpenAPI schema, no codegen.",
        ),
      ),
      code(
        'typescript',
        `const app = new Hono()

const routes = app
  .get('/users/:id', async (c) => {
    const id = c.req.param('id')
    const user = await getUser(id)
    return c.json(user)
  })

// Frontend
const client = hc<typeof routes>('https://api.example.com')
const res = await client.users[':id'].$get({ param: { id: '1' } })
const user = await res.json() // fully typed!`,
      ),
      h2('Middleware composition'),
      p(
        t(
          'Middleware in Hono is just a function. Stack it, scope it, or apply it to specific route groups. No magic, no ',
        ),
        t('app.use()', { type: 'code' }),
        t(' footguns.'),
      ),
      blockquote('The best APIs are the ones that feel obvious in hindsight. Hono achieves that.'),
    ),
  },
  {
    id: POST_5_ID,
    slug: 'the-case-for-boring-technology',
    title: 'The Case for Boring Technology',
    excerpt:
      "New is exciting. But boring technology has something new technology can't offer: a decade of other people's production incidents, already solved.",
    coverImageUrl: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=1200&q=80',
    authorId: AUTHOR_3_ID,
    status: 'published' as const,
    publishedAt: daysAgo(21),
    views: 1_894,
    likes: 97,
    readingTimeMinutes: 4,
    content: makeDoc(
      p(
        t(
          "When Postgres added JSON support, it didn't make MongoDB obsolete overnight. But slowly, quietly, every team that had adopted Mongo for its flexibility started migrating back. The tooling was better. The operators knew it. The failure modes were understood.",
        ),
      ),
      h2('The hidden cost of novelty'),
      p(
        t(
          'Every new technology comes with an invisible tax: the cost of being the first person to hit a specific bug. When you use Postgres, Stack Overflow has your answer. When you use the hot new database, you ',
        ),
        italic('are'),
        t(' Stack Overflow.'),
      ),
      p(
        t("This isn't an argument against ever adopting new things. It's an argument for being "),
        bold('deliberate'),
        t(' about where you spend your novelty budget.'),
      ),
      h2('Boring is a compliment'),
      p(
        t(
          "SQLite, PostgreSQL, Redis, nginx, Linux — these are called boring not because they're bad, but because they're so well-understood that they've disappeared into the background. That's the goal.",
        ),
      ),
      ul(
        'Known failure modes → better runbooks',
        'Established community → faster onboarding',
        'Stable APIs → less maintenance burden',
        'Battle-tested → fewer surprises at 3am',
      ),
      blockquote(
        '"Choose boring technology" — Dan McKinley. Still the best piece of engineering advice I\'ve ever read.',
      ),
      h2('When to be exciting'),
      p(
        t(
          "There are exactly two good reasons to adopt exciting technology: it solves a problem boring technology genuinely can't, or it's a ",
        ),
        italic('personal project'),
        t(' where the learning itself is the point. Everything else is resume-driven development.'),
      ),
    ),
  },
  {
    id: POST_6_ID,
    slug: 'designing-for-readability',
    title: 'Designing for Readability',
    excerpt:
      "Typography is 95% of design. Most developers get the other 5% right and ignore the rest. Here's what actually matters for readable text on the web.",
    coverImageUrl: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1200&q=80',
    authorId: AUTHOR_2_ID,
    status: 'published' as const,
    publishedAt: daysAgo(28),
    views: 3_058,
    likes: 188,
    readingTimeMinutes: 5,
    content: makeDoc(
      p(
        t(
          "When I audit a developer-built UI, the typography is almost always wrong. Not the font choice — usually that's fine. The spacing, the measure, the contrast, the hierarchy. Here's what to fix first.",
        ),
      ),
      h2('Line length (measure)'),
      p(
        t(
          'The optimal line length for body text is 60–75 characters. More than that and your eyes lose their place when jumping to the next line. Less than that and the rhythm feels choppy. The magic CSS: ',
        ),
        t('max-width: 65ch', { type: 'code' }),
        t('.'),
      ),
      h2('Line height matters more than font size'),
      p(
        t('Body text needs a line height of at least '),
        t('1.5', { type: 'code' }),
        t(', ideally '),
        t('1.6–1.7', { type: 'code' }),
        t(
          ' for longer prose. Most browser defaults are far too tight. Tight line height is the single most common readability mistake I see.',
        ),
      ),
      h2('Contrast is non-negotiable'),
      p(
        t('Pure black on white ('),
        t('#000 on #fff', { type: 'code' }),
        t(') is actually too harsh for long reads. Use '),
        t('#111', { type: 'code' }),
        t(' or '),
        t('#18181b', { type: 'code' }),
        t(' on white. For secondary text, '),
        t('#71717a', { type: 'code' }),
        t(' passes WCAG AA at normal sizes.'),
      ),
      blockquote('"Good typography is invisible. Bad typography is everywhere." — Beatrice Warde'),
      ul(
        'Body text: 16–18px, 1.6 line height, 65ch max-width',
        'Secondary text: 14px, slightly reduced contrast',
        'Headings: bold weight, tighter tracking (-0.02em)',
        'Captions: 12–13px, generous letter-spacing',
      ),
      h2('Hierarchy through scale, not decoration'),
      p(
        t(
          "Before you reach for a heavier font weight or a different color to create hierarchy, try scale. A heading that's 1.5× the body size communicates importance clearly without visual noise.",
        ),
      ),
    ),
  },
  {
    id: POST_7_ID,
    slug: 'drizzle-orm-the-sql-you-can-read',
    title: 'Drizzle ORM: The SQL You Can Actually Read',
    excerpt:
      "I've tried them all — Prisma, TypeORM, Sequelize. Drizzle is the first ORM that gets out of my way and lets me write SQL I recognize.",
    coverImageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200&q=80',
    authorId: AUTHOR_1_ID,
    status: 'published' as const,
    publishedAt: daysAgo(35),
    views: 6_120,
    likes: 441,
    readingTimeMinutes: 6,
    content: makeDoc(
      p(
        t(
          "ORMs have a reputation problem. The promise: write objects, forget SQL. The reality: a second language on top of SQL that's less expressive, harder to debug, and full of N+1 traps. Drizzle is different.",
        ),
      ),
      h2('SQL-first, not SQL-last'),
      p(
        t(
          "Drizzle's query API is a thin TypeScript wrapper over SQL syntax, not an abstraction above it. When you write a Drizzle query, you can predict exactly what SQL it generates. That predictability is worth more than any ORM feature.",
        ),
      ),
      code(
        'typescript',
        `// This looks like SQL because it is SQL
const posts = await db
  .select({ title: posts.title, author: users.name })
  .from(posts)
  .innerJoin(users, eq(posts.authorId, users.id))
  .where(eq(posts.status, 'published'))
  .orderBy(desc(posts.publishedAt))
  .limit(10)`,
      ),
      h2('The schema is the source of truth'),
      p(
        t(
          'Define your tables once in TypeScript. Drizzle infers types for selects and inserts automatically. No separate ',
        ),
        t('model.ts', { type: 'code' }),
        t(' files. No decorators. No code generation step that runs before every commit.'),
      ),
      h2('SQLite in dev, Postgres in prod'),
      p(
        t('My favourite Drizzle pattern: use '),
        t('bun:sqlite', { type: 'code' }),
        t(
          ' locally (instant startup, zero infra) and Postgres on the server (scalable, battle-tested). The same schema, the same queries, just swap the driver.',
        ),
      ),
      ul(
        'bun:sqlite → drizzle-orm/bun-sqlite (dev)',
        'pg → drizzle-orm/node-postgres (prod)',
        'Same schema.ts, same query syntax, different URL',
      ),
      blockquote("If you can't read your ORM's output SQL, you don't understand your database."),
      h2('Migrations that make sense'),
      p(
        t(
          'drizzle-kit generates clean, readable SQL migration files. No magic, no obfuscated migration tables. Just plain SQL that you can check into git and review in a PR like any other change.',
        ),
      ),
    ),
  },
]

// ─── Post-tag assignments ─────────────────────────────────────────────────────

const mockPostTags = [
  { postId: POST_1_ID, tagId: TAG_BUN_ID },
  { postId: POST_1_ID, tagId: TAG_DX_ID },
  { postId: POST_2_ID, tagId: TAG_TS_ID },
  { postId: POST_2_ID, tagId: TAG_DX_ID },
  { postId: POST_3_ID, tagId: TAG_CSS_ID },
  { postId: POST_3_ID, tagId: TAG_DESIGN_ID },
  { postId: POST_4_ID, tagId: TAG_BUN_ID },
  { postId: POST_4_ID, tagId: TAG_PERF_ID },
  { postId: POST_5_ID, tagId: TAG_DX_ID },
  { postId: POST_6_ID, tagId: TAG_DESIGN_ID },
  { postId: POST_6_ID, tagId: TAG_CSS_ID },
  { postId: POST_7_ID, tagId: TAG_TS_ID },
  { postId: POST_7_ID, tagId: TAG_BUN_ID },
]

// ─── Run ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding database...')

  // Clear existing data (order matters for FK constraints)
  await db.delete(postTags)
  await db.delete(posts)
  await db.delete(tags)
  await db.delete(users)
  console.log('  ✓ Cleared existing data')

  await db.insert(users).values(mockAuthors)
  console.log(`  ✓ Inserted ${mockAuthors.length} authors`)

  await db.insert(tags).values(mockTags)
  console.log(`  ✓ Inserted ${mockTags.length} tags`)

  await db.insert(posts).values(mockPosts)
  console.log(`  ✓ Inserted ${mockPosts.length} posts`)

  await db.insert(postTags).values(mockPostTags)
  console.log(`  ✓ Inserted ${mockPostTags.length} post-tag links`)

  console.log('\n✅ Seed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
