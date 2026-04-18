import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import app from './app.tsx'

const dbUrl = process.env.DATABASE_URL || './jblog.db'
mkdirSync(dirname(dbUrl), { recursive: true })

const migrationDb = new Database(dbUrl, { create: true })
migrate(drizzle(migrationDb), { migrationsFolder: './src/db/migrations' })
migrationDb.close()

const port = Number(process.env.PORT) || 3000

console.log(`🚀  jblog running at http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
