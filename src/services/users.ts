import { db } from '@/db'
import { users, authorRequests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { User, AuthorRequest } from '@/db/schema'

/** Get a single user by id */
export async function getUserById(id: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return result[0] ?? null
}

/** Get all users awaiting approval, joined with their author request */
export async function getPendingUsers(): Promise<
  (User & { authorRequest: AuthorRequest | null })[]
> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.role, 'pending'))
    .orderBy(users.createdAt)
  const results: (User & { authorRequest: AuthorRequest | null })[] = []

  for (const u of rows) {
    const [req] = await db
      .select()
      .from(authorRequests)
      .where(eq(authorRequests.userId, u.id))
      .limit(1)
    results.push({ ...u, authorRequest: req ?? null })
  }

  return results
}

/** Promote a pending user to author */
export async function approveUser(id: string): Promise<void> {
  await db.update(users).set({ role: 'author', updatedAt: new Date() }).where(eq(users.id, id))
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

// ─── Author requests ──────────────────────────────────────────────────────────

export interface AuthorRequestInput {
  bio: string
  topics: string
  sampleUrl?: string | null
  sampleText?: string | null
}

/** Submit (or update) an author request and set the user's role to pending */
export async function submitAuthorRequest(
  userId: string,
  input: AuthorRequestInput,
): Promise<void> {
  const existing = await db
    .select({ id: authorRequests.id })
    .from(authorRequests)
    .where(eq(authorRequests.userId, userId))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(authorRequests)
      .set({
        bio: input.bio,
        topics: input.topics,
        sampleUrl: input.sampleUrl ?? null,
        sampleText: input.sampleText ?? null,
        updatedAt: new Date(),
      })
      .where(eq(authorRequests.userId, userId))
  } else {
    await db.insert(authorRequests).values({
      id: crypto.randomUUID(),
      userId,
      bio: input.bio,
      topics: input.topics,
      sampleUrl: input.sampleUrl ?? null,
      sampleText: input.sampleText ?? null,
    })
  }

  await db
    .update(users)
    .set({ role: 'pending', rejectedReason: null, updatedAt: new Date() })
    .where(eq(users.id, userId))
}

/** Get the author request for a given user */
export async function getAuthorRequest(userId: string): Promise<AuthorRequest | null> {
  const [req] = await db
    .select()
    .from(authorRequests)
    .where(eq(authorRequests.userId, userId))
    .limit(1)
  return req ?? null
}
