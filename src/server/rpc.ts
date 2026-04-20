import { hc } from 'hono/client'
import type { AppType } from './index'

// ─── Hono RPC client factory ──────────────────────────────────────────────────
// Creates a fully type-safe API client for use in the SPA.
//
// Usage in src/client/rpc.ts:
//
//   import { createApiClient } from '../server/rpc'
//   export const api = createApiClient('/')
//
// In development, Vite proxies /api/* to the Hono server so the base URL is
// just '/'. In production, Hono serves the SPA itself so '/' works there too.

export function createApiClient(baseUrl: string) {
  return hc<AppType>(baseUrl)
}

// Re-export the type for convenience when importing from client code
export type { AppType }
