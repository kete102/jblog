// ─── Client-side format utilities ────────────────────────────────────────────
// Mirrors src/lib/format.ts for use in the SPA (that file is server-only).

/**
 * Format a date as a human-readable string.
 * @param date - Date, ISO string, or null/undefined
 * @param style - 'long' → "January 1, 2025" | 'short' → "Jan 1, 2025"
 */
export function formatDate(
  date: Date | string | null | undefined,
  style: 'long' | 'short' = 'long',
): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  })
}

/**
 * Format a number with a "k" suffix above 999.
 * e.g. 1200 → "1.2k", 999 → "999"
 */
export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
