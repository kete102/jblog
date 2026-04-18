import { sqliteTable, text, integer, primaryKey, unique } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// ─── Users / Authors ─────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  socialLinks: text('social_links', { mode: 'json' })
    .$type<{ twitter?: string; github?: string; website?: string }>()
    .default({}),
  role: text('role', { enum: ['reader', 'pending', 'author', 'admin', 'rejected'] })
    .notNull()
    .default('reader'),
  rejectedReason: text('rejected_reason'),
  publishedPostCount: integer('published_post_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserRole = 'reader' | 'pending' | 'author' | 'admin' | 'rejected'

// ─── Posts ───────────────────────────────────────────────────────────────────

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content', { mode: 'json' })
    .$type<Record<string, unknown>>()
    .default({}),
  coverImageUrl: text('cover_image_url'),
  authorId: text('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['draft', 'published'] })
    .notNull()
    .default('draft'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  readingTimeMinutes: integer('reading_time_minutes').default(1),
  views: integer('views').notNull().default(0),
  likes: integer('likes').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type PostStatus = 'draft' | 'published'

// ─── Tags ────────────────────────────────────────────────────────────────────

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
})

export type Tag = typeof tags.$inferSelect

// ─── Post ↔ Tags (join table) ─────────────────────────────────────────────

export const postTags = sqliteTable(
  'post_tags',
  {
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })],
)

// ─── Post likes (one per IP per post) ────────────────────────────────────────

export const postLikes = sqliteTable(
  'post_likes',
  {
    id: text('id').primaryKey(),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    ip: text('ip').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [unique('post_likes_post_ip').on(t.postId, t.ip)],
)

export type PostLike = typeof postLikes.$inferSelect

// ─── Comments ────────────────────────────────────────────────────────────────

export const comments = sqliteTable('comments', {
  id: text('id').primaryKey(),
  postId: text('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert

// ─── Author requests ──────────────────────────────────────────────────────────

export const authorRequests = sqliteTable('author_requests', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio').notNull(),
  topics: text('topics').notNull(),
  sampleUrl: text('sample_url'),
  sampleText: text('sample_text'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type AuthorRequest = typeof authorRequests.$inferSelect
export type NewAuthorRequest = typeof authorRequests.$inferInsert

// ─── Sessions ────────────────────────────────────────────────────────────────

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type Session = typeof sessions.$inferSelect

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
  posts: many(posts),
  sessions: many(sessions),
  comments: many(comments),
  authorRequest: one(authorRequests, { fields: [users.id], references: [authorRequests.userId] }),
}))

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  postTags: many(postTags),
  postLikes: many(postLikes),
  comments: many(comments),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}))

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postTags.tagId], references: [tags.id] }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, { fields: [postLikes.postId], references: [posts.id] }),
}))

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id], relationName: 'replies' }),
  replies: many(comments, { relationName: 'replies' }),
}))

export const authorRequestsRelations = relations(authorRequests, ({ one }) => ({
  user: one(users, { fields: [authorRequests.userId], references: [users.id] }),
}))
