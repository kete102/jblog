// ─── LikeButton — post like toggle ───────────────────────────────────────────
import React, { useState } from 'react'
import { Heart } from 'lucide-react'
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
  const [popping, setPopping] = useState(false)

  const toggle = async () => {
    if (pending) return
    setPending(true)

    // Optimistic update
    const nextLiked = !liked
    setLiked(nextLiked)
    setLikes((n) => n + (nextLiked ? 1 : -1))
    if (nextLiked) {
      setPopping(true)
      setTimeout(() => setPopping(false), 400)
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
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-colors disabled:opacity-60 border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50 text-zinc-600 hover:text-indigo-700"
    >
      <Heart
        className={`w-5 h-5 transition-colors ${popping ? 'heart-pop' : ''} ${liked ? 'fill-indigo-600 text-indigo-600' : ''}`}
      />
      <span className="text-sm font-medium">{formatNumber(likes)}</span>
    </button>
  )
}
