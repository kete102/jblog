import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import { config } from './config'
import app from './app.tsx'

const { url: dbUrl } = config.database
mkdirSync(dirname(dbUrl), { recursive: true })

const migrationDb = new Database(dbUrl, { create: true })
migrate(drizzle(migrationDb), { migrationsFolder: './src/db/migrations' })
migrationDb.close()

console.log(`🚀  jblog running at http://localhost:${config.server.port}`)

export default {
  port: config.server.port,
  fetch: app.fetch,
}
