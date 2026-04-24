import { Me } from '../types'

export async function fetchMe(): Promise<Me | null> {
  try {
    const res = await fetch('/api/me', { credentials: 'include' })
    return res.ok ? (res.json() as Promise<Me>) : null
  } catch {
    return null
  }
}
