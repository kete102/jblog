import app from './app.tsx'

const port = Number(process.env.PORT) || 3000

console.log(`🚀  jblog running at http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
