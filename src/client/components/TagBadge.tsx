// ─── TagBadge — clickable tag pill ───────────────────────────────────────────
import React from 'react'
import { Link } from '@tanstack/react-router'
import type { Tag } from '../types'

interface TagBadgeProps {
  tag: Tag
  /** If true, renders a non-interactive span instead of a Link */
  static?: boolean
}

export function TagBadge({ tag, static: isStatic }: TagBadgeProps) {
  const className =
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 hover:bg-indigo-100 hover:text-indigo-800 transition-colors'

  if (isStatic) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">
        {tag.name}
      </span>
    )
  }

  return (
    <Link to="/tag/$slug" params={{ slug: tag.slug }} className={className}>
      {tag.name}
    </Link>
  )
}
