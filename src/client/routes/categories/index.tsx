import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Hash } from 'lucide-react'
import { allTagsOptions } from '../../lib/api'

// ─── Categories index page ─────────────────────────────────────────────────────

export const Route = createFileRoute('/categories/')({
  component: CategoriesPage,
})

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}

function CategoriesPage() {
  const { data: tags, isLoading, isError } = useQuery(allTagsOptions)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-base-content">Categorías</h1>
        <p className="text-base-content/50 mt-1 text-sm">
          Explora los temas que cubrimos.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-base-200 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-error">No se pudieron cargar las categorías.</p>
      )}

      {tags && tags.length === 0 && (
        <p className="text-sm text-base-content/50">Todavía no hay categorías.</p>
      )}

      {tags && tags.length > 0 && (
        <motion.div
          className="grid gap-3 sm:grid-cols-2 md:grid-cols-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {tags.map((tag) => (
            <motion.div key={tag.id} variants={item}>
              <Link
                to="/tag/$slug"
                params={{ slug: tag.slug }}
                viewTransition
                className="group flex items-center justify-between gap-3 p-4 rounded-2xl border border-base-300 bg-base-100 hover:border-primary/40 hover:bg-base-200 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Hash className="w-4 h-4 text-primary shrink-0" />
                  <span
                    style={{ viewTransitionName: `tag-title-${tag.slug}` }}
                    className="font-medium text-base-content group-hover:text-primary transition-colors truncate"
                  >
                    {tag.name}
                  </span>
                </div>
                <span className="text-xs text-base-content/40 shrink-0 tabular-nums">
                  {tag.postCount} {tag.postCount === 1 ? 'post' : 'posts'}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
