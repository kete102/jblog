import { useQuery } from '@tanstack/react-query'
import { fetchMe } from '../data/fetchMe'
import { Me } from '../types'

export function useUser() {
  const { data: me } = useQuery<Me | null>({
    queryKey: ['me'],
    queryFn: fetchMe,
    staleTime: 60_000,
  })

  const isAuthor = me?.role === 'author'
  const isAdmin = me?.role === 'admin'

  return {
    me,
    isAdmin,
    isAuthor,
  }
}
