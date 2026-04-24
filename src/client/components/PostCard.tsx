import { Link } from '@tanstack/react-router'
import { Eye, Heart, Clock, Image } from 'lucide-react'
import { motion } from 'framer-motion'
import { TagBadge } from './TagBadge'
import { formatDate, formatNumber } from '../lib/format'
import { cn } from '../lib/cn'
import type { PostSummary } from '../types'

interface PostCardProps {
  post: PostSummary
}

export function PostCard({ post }: PostCardProps) {
  return (
    <motion.article
      whileHover={{ y: -1.5, boxShadow: '0 8px 24px 0 oklch(0% 0 0 / 0.10)' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col rounded-2xl border border-base-300 bg-base-100 overflow-hidden"
    >
      {/* Cover image */}
      {post.coverImageUrl ? (
        <div className="aspect-video overflow-hidden shrink-0">
          <motion.img
            src={post.coverImageUrl}
            alt={post.title}
            whileHover={{ scale: 1.5 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-video  overflow-hidden shrink-0">
          <motion.img
            src="/placeholder.png"
            alt="Placeholder"
            whileHover={{ scale: 1.5 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Title — stretched link covers the whole card */}
        <section className="flex flex-col flex-1">
          <h2 className="text-lg font-semibold text-base-content leading-snug group-hover:text-primary transition-colors">
            <Link
              to="/post/$slug"
              params={{ slug: post.slug }}
              className={cn(
                'stretched-link focus:outline-none',
                'hover:text-primary transition-colors',
              )}
            >
              {post.title}
            </Link>
          </h2>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-sm text-base-content/60 line-clamp-3 leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </section>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 relative z-10">
            {post.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        {/* Footer: author + meta */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-base-200">
          {/* Author */}
          <Link
            to="/author/$authorId"
            params={{ authorId: post.author.id }}
            className="relative z-10 flex items-center gap-2 text-sm text-base-content/70 hover:text-base-content transition-colors"
          >
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={post.author.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center">
                <span className="text-xs font-medium text-base-content/60">
                  {post.author.name[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-medium">{post.author.name}</span>
          </Link>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-base-content/50">
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
        <div className="flex items-center justify-between w-full gap-3 text-xs text-base-content/50">
          {post.publishedAt && (
            <p className="text-xs text-base-content/50">{formatDate(post.publishedAt, 'short')}</p>
          )}
          {post.readingTimeMinutes != null && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readingTimeMinutes} min
            </span>
          )}
        </div>
      </div>
    </motion.article>
  )
}
