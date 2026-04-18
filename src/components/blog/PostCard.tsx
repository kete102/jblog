import React from 'react'
import type { Post, User, Tag } from '@/db/schema'
import AuthorBadge from '@/components/blog/AuthorBadge'
import Avatar from '@/components/blog/Avatar'
import TagPill from '@/components/blog/TagPill'
import { EyeIcon, HeartIcon } from '@/components/icons'
import { isVerifiedAuthor } from '@/lib/roles'
import { formatDate, formatNumber } from '@/lib/format'

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

function EngagementBadges({ views, likes }: { views: number; likes: number }) {
  return (
    <div className="flex items-center gap-3 text-xs text-zinc-400">
      <span className="flex items-center gap-1">
        <EyeIcon className="w-3.5 h-3.5" />
        {formatNumber(views)}
      </span>
      <span className="flex items-center gap-1">
        <HeartIcon className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth={1.5} />
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
                <TagPill key={tag.id} tag={tag} variant="featured" className="relative z-[2]" />
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
              <Avatar name={post.author.name} avatarUrl={post.author.avatarUrl} size="md" loading="lazy" />
              <div className="text-xs text-zinc-500">
                <div className="flex items-center gap-1 mb-0.5">
                  <a
                    href={`/author/${post.author.id}`}
                    className="relative z-[2] font-medium text-zinc-700 hover:text-indigo-600 transition-colors"
                  >
                    {post.author.name}
                  </a>
                  {isVerifiedAuthor(post.author) && <AuthorBadge />}
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
              <TagPill key={tag.id} tag={tag} variant="card" className="relative z-[2]" />
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
            <Avatar name={post.author.name} avatarUrl={post.author.avatarUrl} size="xs" loading="lazy" />
            <div className="text-xs text-zinc-500 flex items-center gap-1 min-w-0">
              <a
                href={`/author/${post.author.id}`}
                className="relative z-[2] font-medium text-zinc-600 hover:text-indigo-600 transition-colors truncate"
              >
                {post.author.name}
              </a>
              {isVerifiedAuthor(post.author) && <AuthorBadge />}
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
