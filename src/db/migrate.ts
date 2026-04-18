import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

const dbUrl = process.env.DATABASE_URL || './jblog.db'

// Ensure the parent directory exists (e.g. /data on Fly.io volume)
mkdirSync(dirname(dbUrl), { recursive: true })

console.log(`Running migrations on: ${dbUrl}`)

const sqlite = new Database(dbUrl, { create: true })
sqlite.exec('PRAGMA journal_mode = WAL;')
sqlite.exec('PRAGMA foreign_keys = ON;')

const db = drizzle(sqlite)

migrate(db, { migrationsFolder: './src/db/migrations' })

console.log('Migrations complete.')
sqlite.close()
