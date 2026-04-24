// ─── Shared client-side API response types ───────────────────────────────────
// These mirror the JSON shapes returned by src/server/routes/api/*.
// Used by all route files and components throughout the SPA.

export type UserRole = 'reader' | 'pending' | 'author' | 'admin' | 'rejected'

export interface SocialLinks {
  twitter?: string
  github?: string
  website?: string
}

export interface Tag {
  id: string
  name: string
  slug: string
}

export interface TagWithCount extends Tag {
  postCount: number
}

/** Author as returned in public-facing endpoints (/api/authors/:id) */
export interface Author {
  id: string
  name: string
  avatarUrl: string | null
  bio: string | null
  socialLinks: SocialLinks
  publishedPostCount: number
  role: UserRole
}

/** Compact author summary embedded in post list items */
export interface AuthorSummary {
  id: string
  name: string
  avatarUrl: string | null
  publishedPostCount: number
}

/** Authenticated current user (GET /api/me) */
export interface Me {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  bio: string | null
  socialLinks: SocialLinks
  role: UserRole
  rejectedReason: string | null
  publishedPostCount: number
}

/** Post summary — used in list views (home, tag, author) */
export interface PostSummary {
  id: string
  slug: string
  title: string
  excerpt: string | null
  coverImageUrl: string | null
  status: 'draft' | 'published'
  publishedAt: string | null
  readingTimeMinutes: number | null
  views: number
  likes: number
  author: AuthorSummary
  tags: Tag[]
}

/** Full post — includes Tiptap JSON content and full author (GET /api/posts/:slug) */
export interface PostFull extends Omit<PostSummary, 'author'> {
  content: Record<string, unknown>
  author: Author
}

/** Comment row with user info */
export interface CommentWithUser {
  id: string
  postId: string
  userId: string
  parentId: string | null
  content: string
  createdAt: string
  updatedAt: string
  user: {
    name: string
    avatarUrl: string | null
  }
}

/** Top-level comment + its replies */
export interface CommentThread {
  comment: CommentWithUser
  replies: CommentWithUser[]
}

// ─── Page-level response shapes ───────────────────────────────────────────────

export interface PostsPage {
  posts: PostSummary[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasPrev: boolean
  hasNext: boolean
}

export interface TagPage {
  tag: Tag
  posts: PostSummary[]
  total: number
}

export interface AuthorPage {
  author: Author
  posts: PostSummary[]
}

export interface AuthorsList {
  authors: Author[]
}

export interface PostPage {
  post: PostFull
  comments: CommentThread[]
  liked: boolean
}

// ─── Dashboard-specific shapes ────────────────────────────────────────────────

export interface DashboardPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  coverImageUrl: string | null
  status: 'draft' | 'published'
  views: number
  likes: number
  publishedAt: string | null
  updatedAt: string
  tags: Tag[]
}

export interface DashboardPostEditData {
  post: {
    id: string
    slug: string
    title: string
    excerpt: string | null
    coverImageUrl: string | null
    content: Record<string, unknown>
    status: 'draft' | 'published'
    tagIds: string[]
  }
  allTags: Tag[]
}

/** Pending author request as seen by admins (GET /api/dashboard/admin/requests) */
export interface AuthorRequestDetails {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  createdAt: string
  authorRequest: {
    bio: string
    topics: string
    sampleUrl: string | null
    sampleText: string | null
  } | null
}

/** Current user's author request status (GET /api/dashboard/become-author) */
export interface BecomeAuthorData {
  authorRequest: {
    bio: string
    topics: string
    sampleUrl: string | null
    sampleText: string | null
  } | null
  rejectedReason: string | null
}
