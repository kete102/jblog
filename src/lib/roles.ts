import type { User } from '@/db/schema'

/** Returns true if the user is a verified author or admin. */
export function isVerifiedAuthor(user: Pick<User, 'role'>): boolean {
  return user.role === 'author' || user.role === 'admin'
}
