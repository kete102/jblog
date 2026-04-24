import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { allAuthorsOptions } from '../../lib/api'
import { AuthorCard } from '../../components/AuthorCard'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}

export const Route = createFileRoute('/contributors/')({
  component: ContributorsPage,
})

function ContributorsPage() {
  const { data: authors, isLoading, isError } = useQuery(allAuthorsOptions)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-base-content">Autores</h1>
        <p className="text-base-content/50 mt-1 text-sm">
          Las personas detrás de Destellos de Luz.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-base-200 animate-pulse" />
          ))}
        </div>
      )}

      {isError && <p className="text-sm text-error">No se pudieron cargar los autores.</p>}

      {authors && authors.length === 0 && (
        <p className="text-sm text-base-content/50">Todavía no hay autores.</p>
      )}

      {authors && authors.length > 0 && (
        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {authors.map((author) => (
            <motion.div key={author.id} variants={item} className="h-full">
              <AuthorCard author={author} nameViewTransition={`author-name-${author.id}`} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
