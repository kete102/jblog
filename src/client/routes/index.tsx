import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion, type Variants } from 'framer-motion'
import { PostCard } from '../components/PostCard'
import { Pagination } from '../components/Pagination'
import { postsOptions } from '../lib/api'
import { usePageTitle } from '../lib/usePageTitle'

// ─── Home — paginated published post listing ───────────────────────────────────

export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(postsOptions(1)),
  component: HomePage,
})

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}

function HomePage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useQuery(postsOptions(page))
  usePageTitle()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-base-content/50 text-sm">Cargando publicaciones…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-error text-sm">No se pudieron cargar las publicaciones.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-base-content mb-8">Publicaciones</h1>

      {data.posts.length === 0 ? (
        <p className="text-base-content/50 text-sm">Todavía no hay publicaciones.</p>
      ) : (
        <motion.div
          key={page}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {data.posts.map((post) => (
            <motion.div key={post.id} variants={item} className="h-full">
              <PostCard post={post} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        hasPrev={data.hasPrev}
        hasNext={data.hasNext}
        onPage={setPage}
      />
    </div>
  )
}
