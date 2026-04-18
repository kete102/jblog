import React from 'react'

interface TagPillProps {
  tag: { id: string; slug: string; name: string }
  /**
   * 'page'     → post page (font-semibold, border, px-2.5)
   * 'featured' → featured card (font-medium, no border, px-2.5)
   * 'card'     → standard card (font-medium, no border, px-2)
   */
  variant?: 'page' | 'featured' | 'card'
  /** Extra classes forwarded to the anchor (e.g. "relative z-[2]"). */
  className?: string
}

const variantCls = {
  page: 'font-semibold px-2.5 border border-indigo-100',
  featured: 'font-medium px-2.5',
  card: 'font-medium px-2',
}

export default function TagPill({ tag, variant = 'featured', className = '' }: TagPillProps) {
  return (
    <a
      href={`/tag/${tag.slug}`}
      className={`text-xs text-indigo-600 bg-indigo-50 py-0.5 rounded-full hover:bg-indigo-100 transition-colors ${variantCls[variant]} ${className}`}
    >
      {tag.name}
    </a>
  )
}
