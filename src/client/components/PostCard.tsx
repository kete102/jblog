// ─── PostCard — post summary in a list view ───────────────────────────────────
import React from 'react'
import { Link } from '@tanstack/react-router'
import { Eye, Heart, Clock } from 'lucide-react'
import { TagBadge } from './TagBadge'
import { formatDate, formatNumber } from '../lib/format'
import type { PostSummary } from '../types'

interface PostCardProps {
  post: PostSummary
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="relative group flex flex-col rounded-2xl border border-zinc-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
      {/* Cover image */}
      {post.coverImageUrl && (
        <div className="aspect-video overflow-hidden shrink-0">
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 relative z-10">
            {post.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        {/* Title — stretched link covers the whole card */}
        <h2 className="text-lg font-semibold text-zinc-900 leading-snug group-hover:text-indigo-700 transition-colors">
          <Link
            to="/post/$slug"
            params={{ slug: post.slug }}
            className="stretched-link focus:outline-none"
          >
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-zinc-500 line-clamp-3 leading-relaxed">{post.excerpt}</p>
        )}

        {/* Footer: author + meta */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-100">
          {/* Author */}
          <Link
            to="/author/$authorId"
            params={{ authorId: post.author.id }}
            className="relative z-10 flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={post.author.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center">
                <span className="text-xs font-medium text-zinc-500">
                  {post.author.name[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-medium">{post.author.name}</span>
          </Link>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            {post.readingTimeMinutes != null && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {post.readingTimeMinutes} min
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {formatNumber(post.views)}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              {formatNumber(post.likes)}
            </span>
          </div>
        </div>

        {/* Date */}
        {post.publishedAt && (
          <p className="text-xs text-zinc-400">{formatDate(post.publishedAt, 'short')}</p>
        )}
      </div>
    </article>
  )
}
