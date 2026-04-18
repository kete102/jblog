import React from 'react'
import type { Post, User, Tag } from '@/db/schema'
import AuthorBadge from '@/components/blog/AuthorBadge'

export interface PostWithAuthorAndTags extends Post {
  author: User
  tags: Tag[]
}

interface PostCardProps {
  post: PostWithAuthorAndTags
  featured?: boolean
  style?: React.CSSProperties
  className?: string
}

function formatDate(date: Date | null) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function EngagementBadges({ views, likes }: { views: number; likes: number }) {
  return (
    <div className="flex items-center gap-3 text-xs text-zinc-400">
      <span className="flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
        {formatNumber(views)}
      </span>
      <span className="flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
        {formatNumber(likes)}
      </span>
    </div>
  )
}

export default function PostCard({ post, featured = false, style, className = '' }: PostCardProps) {
  if (featured) {
    return (
    <article style={style} className={`group relative grid md:grid-cols-2 gap-6 rounded-2xl overflow-hidden border border-zinc-100 hover:border-zinc-200 transition-all duration-300 hover:shadow-lg cursor-pointer ${className}`}>
        {/* Cover — above the fold, load eagerly */}
        {post.coverImageUrl ? (
          <div className="relative overflow-hidden bg-zinc-100 aspect-video md:aspect-auto">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ) : (
          <div className="relative bg-gradient-to-br from-indigo-50 to-violet-50 aspect-video md:aspect-auto flex items-center justify-center">
            <span className="text-6xl opacity-20">✍️</span>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col justify-center p-6 md:p-8">
          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.slice(0, 3).map((tag) => (
                <a
                  key={tag.id}
                  href={`/tag/${tag.slug}`}
                  className="relative z-[2] text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full hover:bg-indigo-100 transition-colors"
                >
                  {tag.name}
                </a>
              ))}
            </div>
          )}

          <h2 className="text-2xl font-bold text-zinc-900 leading-tight mb-3 group-hover:text-indigo-600 transition-colors">
            <a href={`/post/${post.slug}`} className="stretched-link">
              {post.title}
            </a>
          </h2>

          {post.excerpt && (
            <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3 mb-4">
              {post.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between gap-3 mt-auto flex-wrap">
            <div className="flex items-center gap-3">
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.name}
                  width={32}
                  height={32}
                  loading="lazy"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
                  {post.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-xs text-zinc-500">
                <div className="flex items-center gap-1 mb-0.5">
                  <a
                    href={`/author/${post.author.id}`}
                    className="relative z-[2] font-medium text-zinc-700 hover:text-indigo-600 transition-colors"
                  >
                    {post.author.name}
                  </a>
                  {(post.author.role === 'author' || post.author.role === 'admin') && (
                    <AuthorBadge />
                  )}
                </div>
                <time dateTime={post.publishedAt?.toISOString()}>
                  {formatDate(post.publishedAt)}
                </time>
                {post.readingTimeMinutes && (
                  <>
                    <span className="mx-1">·</span>
                    {post.readingTimeMinutes} min read
                  </>
                )}
              </div>
            </div>
            <EngagementBadges views={post.views} likes={post.likes} />
          </div>
        </div>
      </article>
    )
  }

  return (
    <article style={style} className={`group relative flex flex-col rounded-xl overflow-hidden border border-zinc-100 hover:border-zinc-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${className}`}>
      {/* Cover */}
      {post.coverImageUrl ? (
        <div className="relative overflow-hidden bg-zinc-100 aspect-video">
          <img
            src={post.coverImageUrl}
            alt={post.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 aspect-video flex items-center justify-center">
          <span className="text-4xl opacity-20">✍️</span>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {post.tags.slice(0, 2).map((tag) => (
              <a
                key={tag.id}
                href={`/tag/${tag.slug}`}
                className="relative z-[2] text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full hover:bg-indigo-100 transition-colors"
              >
                {tag.name}
              </a>
            ))}
          </div>
        )}

        <h2 className="font-semibold text-zinc-900 leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
          <a href={`/post/${post.slug}`} className="stretched-link">
            {post.title}
          </a>
        </h2>

        {post.excerpt && (
          <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2 mb-4">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-4 border-t border-zinc-50 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={post.author.name}
                width={24}
                height={24}
                loading="lazy"
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                {post.author.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-xs text-zinc-500 flex items-center gap-1 min-w-0">
              <a
                href={`/author/${post.author.id}`}
                className="relative z-[2] font-medium text-zinc-600 hover:text-indigo-600 transition-colors truncate"
              >
                {post.author.name}
              </a>
              {(post.author.role === 'author' || post.author.role === 'admin') && (
                <AuthorBadge />
              )}
              <span>·</span>
              <time dateTime={post.publishedAt?.toISOString()}>
                {formatDate(post.publishedAt)}
              </time>
            </div>
          </div>
          <EngagementBadges views={post.views} likes={post.likes} />
        </div>
      </div>
    </article>
  )
}
