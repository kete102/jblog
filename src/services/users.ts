import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { User } from '@/db/schema'

/** Get all users awaiting approval */
export async function getPendingUsers(): Promise<User[]> {
  return db.select().from(users).where(eq(users.role, 'pending')).orderBy(users.createdAt)
}

/** Promote a pending user to author */
export async function approveUser(id: string): Promise<void> {
  await db
    .update(users)
    .set({ role: 'author', updatedAt: new Date() })
    .where(eq(users.id, id))
}

/** Delete a pending user's account */
export async function rejectUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id))
}

export interface UpdateProfileInput {
  name: string
  bio?: string | null
  avatarUrl?: string | null
  socialLinks?: { twitter?: string; github?: string; website?: string }
}

/** Update an author's public profile */
export async function updateUserProfile(id: string, input: UpdateProfileInput): Promise<void> {
  await db
    .update(users)
    .set({
      name: input.name,
      bio: input.bio ?? null,
      avatarUrl: input.avatarUrl ?? null,
      socialLinks: input.socialLinks ?? {},
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
}
