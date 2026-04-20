// ─── Typed Hono RPC client ────────────────────────────────────────────────────
// NOTE: The full `hc<AppType>` client where AppType = typeof root app is not
// used here because the root Hono instance has middleware (serveStatic, cors,
// app.use('*', ...)) that breaks TypeScript's ability to traverse the route
// chain generics. Phase 5 will extract a clean API-router-only type and wire
// this up properly.
//
// For now, each route file uses plain fetch() or per-route typed clients as
// needed. This file is a placeholder for Phase 5.

export {}
