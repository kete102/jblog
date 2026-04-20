// ─── PostContent — renders a Tiptap doc as React JSX ─────────────────────────
import React from 'react'
import { tiptapToJsx } from '../lib/tiptap-to-jsx'

interface PostContentProps {
  doc: Record<string, unknown>
  className?: string
}

export function PostContent({ doc, className }: PostContentProps) {
  return <div className={`prose prose-zinc max-w-none ${className ?? ''}`}>{tiptapToJsx(doc)}</div>
}
