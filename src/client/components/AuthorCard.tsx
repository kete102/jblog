// ─── AuthorCard — author bio card ─────────────────────────────────────────────
import React from 'react'
import { Link } from '@tanstack/react-router'
import { ExternalLink, BookOpen } from 'lucide-react'
import type { Author } from '../types'

interface AuthorCardProps {
  author: Author
  /** Show a link to the author's public page */
  linkToProfile?: boolean
}

export function AuthorCard({ author, linkToProfile = true }: AuthorCardProps) {
  const nameEl = linkToProfile ? (
    <Link
      to="/author/$authorId"
      params={{ authorId: author.id }}
      className="text-lg font-semibold text-zinc-900 hover:text-indigo-700 transition-colors"
    >
      {author.name}
    </Link>
  ) : (
    <span className="text-lg font-semibold text-zinc-900">{author.name}</span>
  )

  return (
    <div className="flex gap-4 p-5 rounded-2xl border border-zinc-200 bg-zinc-50">
      {/* Avatar */}
      {author.avatarUrl ? (
        <img
          src={author.avatarUrl}
          alt={author.name}
          className="w-14 h-14 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
          <span className="text-xl font-semibold text-zinc-500">
            {author.name[0]?.toUpperCase()}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1 min-w-0">
        {nameEl}

        {/* Published count */}
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <BookOpen className="w-3.5 h-3.5" />
          {author.publishedPostCount}{' '}
          {author.publishedPostCount === 1 ? 'publicación' : 'publicaciones'}
        </div>

        {/* Bio */}
        {author.bio && (
          <p className="text-sm text-zinc-600 mt-1 line-clamp-3">{author.bio}</p>
        )}

        {/* Social links */}
        <div className="flex items-center gap-3 mt-2">
          {author.socialLinks.twitter && (
            <a
              href={`https://twitter.com/${author.socialLinks.twitter.replace(/^@/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter / X"
              title="Twitter / X"
              className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Twitter</span>
            </a>
          )}
          {author.socialLinks.github && (
            <a
              href={`https://github.com/${author.socialLinks.github.replace(/^@/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
              className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          )}
          {author.socialLinks.website && (
            <a
              href={author.socialLinks.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Sitio web"
              title="Sitio web"
              className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Web</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
