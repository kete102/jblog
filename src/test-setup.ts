// Preloaded by Bun before every test run (see bunfig.toml [test].preload).
// Sets minimal dummy values for required env vars so modules that call
// required() in config.ts don't throw during import. Real values from .env
// still take precedence because we only set if not already defined.

process.env.BASE_URL ??= 'http://localhost:3000'
process.env.GOOGLE_CLIENT_ID ??= 'ci-fake'
process.env.GOOGLE_CLIENT_SECRET ??= 'ci-fake'
process.env.ADMIN_EMAIL ??= 'admin@ci.test'
process.env.DATABASE_URL ??= ':memory:'
