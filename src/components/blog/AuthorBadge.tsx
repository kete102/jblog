import React from 'react'

/** Small verified-author checkmark badge. Drop it inline next to any author name. */
export default function AuthorBadge({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      className={`shrink-0 text-indigo-500 ${className}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-label="Verified author"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}
