// ─── Environment configuration ────────────────────────────────────────────
// Single source of truth for all environment variables.
// Required vars throw at startup if missing — fail fast, never silently.

type NodeEnv = 'development' | 'production' | 'test'

interface ServerConfig {
  port: number
  nodeEnv: NodeEnv
  isProduction: boolean
  baseUrl: string
}

interface DatabaseConfig {
  url: string
}

interface AuthConfig {
  googleClientId: string
  googleClientSecret: string
  adminEmail: string
}

interface S3Config {
  endpoint: string | undefined
  bucket: string | undefined
  region: string | undefined
  accessKeyId: string | undefined
  secretAccessKey: string | undefined
  publicUrl: string | undefined
}

export interface AppConfig {
  server: ServerConfig
  database: DatabaseConfig
  auth: AuthConfig
  s3: S3Config
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`[config] Missing required environment variable: "${name}"`)
  return value
}

function optional(name: string): string | undefined
function optional(name: string, fallback: string): string
function optional(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback
}

const nodeEnv = optional('NODE_ENV', 'development') as NodeEnv

export const config: AppConfig = {
  server: {
    port: Number(optional('PORT', '3000')),
    nodeEnv,
    isProduction: nodeEnv === 'production',
    baseUrl: required('BASE_URL'),
  },
  database: {
    url: optional('DATABASE_URL', './jblog.db'),
  },
  auth: {
    googleClientId: required('GOOGLE_CLIENT_ID'),
    googleClientSecret: required('GOOGLE_CLIENT_SECRET'),
    adminEmail: required('ADMIN_EMAIL'),
  },
  s3: {
    endpoint: optional('S3_ENDPOINT'),
    bucket: optional('S3_BUCKET'),
    region: optional('S3_REGION'),
    accessKeyId: optional('S3_ACCESS_KEY_ID'),
    secretAccessKey: optional('S3_SECRET_ACCESS_KEY'),
    publicUrl: optional('S3_PUBLIC_URL'),
  },
}
