import React from 'react'

interface LogoProps {
  /** 'md' = w-7 h-7 (navbar / dashboard); 'sm' = w-6 h-6 (footer) */
  size?: 'sm' | 'md'
}

export default function Logo({ size = 'md' }: LogoProps) {
  const boxCls =
    size === 'sm'
      ? 'w-6 h-6 rounded-md text-xs'
      : 'w-7 h-7 rounded-lg text-sm'

  return (
    <a href="/" className="flex items-center gap-2 group">
      <span
        className={`${boxCls} bg-indigo-600 flex items-center justify-center text-white font-bold group-hover:bg-indigo-700 transition-colors`}
      >
        j
      </span>
      <span className="font-semibold text-zinc-900 tracking-tight">jblog</span>
    </a>
  )
}
