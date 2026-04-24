import { motion, useAnimation } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/cn'
import { formatNumber } from '../lib/format'

interface LikeButtonProps {
  slug: string
  initialLikes: number
  initialLiked: boolean
}

export function LikeButton({ slug, initialLikes, initialLiked }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likes, setLikes] = useState(initialLikes)
  const [pending, setPending] = useState(false)
  const heartControls = useAnimation()

  const toggle = async () => {
    if (pending) return
    setPending(true)

    const nextLiked = !liked
    setLiked(nextLiked)
    setLikes((n) => n + (nextLiked ? 1 : -1))

    if (nextLiked) {
      void heartControls.start({
        scale: [1, 1.45, 0.85, 1.1, 1],
        transition: { duration: 0.4, ease: 'easeOut' },
      })
    }

    try {
      const res = await fetch(`/api/posts/${slug}/like`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { liked: boolean; likes: number }
      setLiked(data.liked)
      setLikes(data.likes)
    } catch {
      // Roll back optimistic update on failure
      setLiked(!nextLiked)
      setLikes((n) => n + (nextLiked ? -1 : 1))
    } finally {
      setPending(false)
    }
  }

  return (
    <motion.button
      type="button"
      onClick={toggle}
      disabled={pending}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}
      className={cn(
        'inline-flex items-center cursor-pointer gap-2 px-4 py-2 rounded-full border transition-colors disabled:opacity-60',
        'border-base-300 hover:border-primary/40 hover:bg-primary/10',
        'text-base-content/70 hover:text-primary',
      )}
    >
      <motion.span animate={heartControls} className="inline-flex">
        <Heart className={cn('w-5 h-5 transition-colors', liked && 'fill-primary text-primary')} />
      </motion.span>
      <span className="text-sm font-medium">{formatNumber(likes)}</span>
    </motion.button>
  )
}
