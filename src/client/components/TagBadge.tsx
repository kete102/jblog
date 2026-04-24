// ─── TagBadge — clickable tag pill ───────────────────────────────────────────
import React from 'react'
import { Link } from '@tanstack/react-router'
import type { Tag } from '../types'
import { cn } from '../lib/cn'

interface TagBadgeProps {
  tag: Tag
  /** If true, renders a non-interactive span instead of a Link */
  static?: boolean
}

const pillBase =
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-base-200 text-base-content/80'

export function TagBadge({ tag, static: isStatic }: TagBadgeProps) {
  if (isStatic) {
    return <span className={pillBase}>{tag.name}</span>
  }

  return (
    <Link
      to="/tag/$slug"
      params={{ slug: tag.slug }}
      className={cn(pillBase, 'hover:bg-primary/20 hover:text-primary transition-colors')}
    >
      {tag.name}
    </Link>
  )
}
