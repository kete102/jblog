import type React from 'react'
import type { SeoProps } from './lib/seo'

declare module 'hono' {
  interface ContextRenderer {
    (
      element: React.ReactElement,
      props?: {
        seo?: SeoProps
        clientBundle?: 'editor' | null
      },
    ): Response | Promise<Response>
  }
}
