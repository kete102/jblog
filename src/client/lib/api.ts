// ─── Typed fetch helpers + TanStack Query queryOptions ────────────────────────
// All client → API communication goes through this file.

import { queryOptions } from '@tanstack/react-query'
import type {
  Me,
  PostsPage,
  TagPage,
  TagWithCount,
  PostPage,
  AuthorPage,
  AuthorsList,
  DashboardPost,
  DashboardPostEditData,
  AuthorRequestDetails,
  BecomeAuthorData,
} from '../types'

// ─── Low-level helpers ────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`${res.status} ${text}`)
  }
  return res.json() as Promise<T>
}

// ─── Public endpoints ─────────────────────────────────────────────────────────

export const meOptions = queryOptions({
  queryKey: ['me'],
  queryFn: () =>
    fetch('/api/me', { credentials: 'include' })
      .then((r) => (r.ok ? (r.json() as Promise<Me>) : null))
      .catch(() => null),
  staleTime: 30_000,
})

export function postsOptions(page: number) {
  return queryOptions({
    queryKey: ['posts', page],
    queryFn: () => apiFetch<PostsPage>(`/api/posts?page=${page}`),
    staleTime: 60_000,
  })
}

export function postOptions(slug: string) {
  return queryOptions({
    queryKey: ['post', slug],
    queryFn: () => apiFetch<PostPage>(`/api/posts/${slug}`),
    staleTime: 60_000,
  })
}

export function tagPostsOptions(slug: string) {
  return queryOptions({
    queryKey: ['tag', slug],
    queryFn: () => apiFetch<TagPage>(`/api/posts?tag=${encodeURIComponent(slug)}`),
    staleTime: 60_000,
  })
}

export function authorOptions(authorId: string) {
  return queryOptions({
    queryKey: ['author', authorId],
    queryFn: () => apiFetch<AuthorPage>(`/api/authors/${authorId}`),
    staleTime: 60_000,
  })
}

export const allAuthorsOptions = queryOptions({
  queryKey: ['authors'],
  queryFn: () => apiFetch<AuthorsList>('/api/authors').then((d) => d.authors),
  staleTime: 5 * 60_000,
})

export const allTagsOptions = queryOptions({
  queryKey: ['tags'],
  queryFn: () =>
    apiFetch<{ tags: TagWithCount[] }>('/api/tags').then((d) => d.tags),
  staleTime: 5 * 60_000,
})

export const changelogOptions = queryOptions({
  queryKey: ['changelog'],
  queryFn: () => apiFetch<{ markdown: string }>('/api/changelog'),
  staleTime: 10 * 60_000,
})

// ─── Dashboard endpoints ──────────────────────────────────────────────────────

export const dashboardPostsOptions = queryOptions({
  queryKey: ['dashboard', 'posts'],
  queryFn: () => apiFetch<{ posts: DashboardPost[] }>('/api/dashboard/posts').then((d) => d.posts),
  staleTime: 30_000,
})

export const dashboardTagsOptions = queryOptions({
  queryKey: ['dashboard', 'tags'],
  queryFn: () =>
    apiFetch<{ tags: import('../types').Tag[] }>('/api/dashboard/posts/tags').then((d) => d.tags),
  staleTime: 5 * 60_000,
})

export function dashboardPostEditOptions(id: string) {
  return queryOptions({
    queryKey: ['dashboard', 'post', id],
    queryFn: () => apiFetch<DashboardPostEditData>(`/api/dashboard/posts/${id}`),
    staleTime: 30_000,
  })
}

export const dashboardProfileOptions = queryOptions({
  queryKey: ['dashboard', 'profile'],
  queryFn: () => apiFetch<Me>('/api/dashboard/profile'),
  staleTime: 30_000,
})

export const adminRequestsOptions = queryOptions({
  queryKey: ['dashboard', 'admin', 'requests'],
  queryFn: () =>
    apiFetch<{ requests: AuthorRequestDetails[] }>('/api/dashboard/admin/requests').then(
      (d) => d.requests,
    ),
  staleTime: 30_000,
})

export const becomeAuthorOptions = queryOptions({
  queryKey: ['dashboard', 'become-author'],
  queryFn: () => apiFetch<BecomeAuthorData>('/api/dashboard/become-author'),
  staleTime: 30_000,
})
