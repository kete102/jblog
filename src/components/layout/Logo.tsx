import React from 'react'

interface LogoProps {
  /** 'md' = w-7 h-7 (navbar / dashboard); 'sm' = w-6 h-6 (footer) */
  size?: 'sm' | 'md'
}

export default function Logo({ size = 'md' }: LogoProps) {
  const boxCls =
    size === 'sm'
      ? 'w-6 h-6 rounded-md'
      : 'w-7 h-7 rounded-lg'

  const iconSize = size === 'sm' ? 14 : 16

  return (
    <a href="/" className="flex items-center gap-2 group">
      <span
        className={`${boxCls} bg-amber-500 flex items-center justify-center group-hover:bg-amber-600 transition-colors shrink-0`}
      >
        {/* 4-pointed star — represents "destellos de luz" (flashes of light) */}
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="white"
          aria-hidden="true"
        >
          <path d="M12 2 L13.4 10.6 L22 12 L13.4 13.4 L12 22 L10.6 13.4 L2 12 L10.6 10.6 Z" />
        </svg>
      </span>
      <span className="font-semibold text-zinc-900 tracking-tight">Destellos de luz</span>
    </a>
  )
}
