import React from 'react'

interface AvatarProps {
  name: string
  avatarUrl: string | null | undefined
  /**
   * xs = w-6 h-6  (PostCard standard)
   * sm = w-7 h-7  (DashboardShell sidebar)
   * md = w-8 h-8  (PostCard featured, Navbar, CommentRow reply)
   * lg = w-9 h-9  (post meta row, CommentRow top-level)
   * xl = w-14 h-14 (post author card)
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Adds ring-2 ring-zinc-100 to the image. */
  ring?: boolean
  /** Applied to the root element (img or initials div). */
  className?: string
  loading?: 'eager' | 'lazy'
}

const sizes = {
  xs: { box: 'w-6 h-6', text: 'text-[10px]' },
  sm: { box: 'w-7 h-7', text: 'text-xs' },
  md: { box: 'w-8 h-8', text: 'text-xs' },
  lg: { box: 'w-9 h-9', text: 'text-sm' },
  xl: { box: 'w-14 h-14', text: 'text-xl' },
}

export default function Avatar({
  name,
  avatarUrl,
  size = 'md',
  ring = false,
  className = '',
  loading,
}: AvatarProps) {
  const { box, text } = sizes[size]
  const ringCls = ring ? 'ring-2 ring-zinc-100' : ''

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        loading={loading}
        className={`${box} rounded-full object-cover shrink-0 ${ringCls} ${className}`}
      />
    )
  }

  return (
    <div
      className={`${box} ${text} rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold shrink-0 ${className}`}
    >
      {initials}
    </div>
  )
}
