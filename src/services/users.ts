import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { User } from '@/db/schema'

/** Get a single user by id */
export async function getUserById(id: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return result[0] ?? null
}

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

/** Mark a pending user as rejected, storing the reason */
export async function rejectUser(id: string, reason?: string): Promise<void> {
  await db
    .update(users)
    .set({ role: 'rejected', rejectedReason: reason?.trim() || null, updatedAt: new Date() })
    .where(eq(users.id, id))
}

export interface UpdateProfileInput {
  name: string
  bio?: string | null
  avatarUrl?: string | null
  socialLinks?: { twitter?: string; github?: string; website?: string }
}

/** Delete a user account and all associated data (cascades via FK) */
export async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id))
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
