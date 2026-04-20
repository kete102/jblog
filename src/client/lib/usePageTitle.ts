// ─── usePageTitle — update document.title for the current route ───────────────
// Call at the top of any route page component.
// Updates document.title on mount and whenever the title changes.
// Resets to the site name on unmount so navigation always has a clean state.

import { useEffect } from 'react'

const SITE_NAME = 'JBlog'

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME
    return () => {
      document.title = SITE_NAME
    }
  }, [title])
}
