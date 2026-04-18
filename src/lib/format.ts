/**
 * Format a date for display.
 * - 'long'  → "January 1, 2025"  (fallback: '')
 * - 'short' → "Jan 1, 2025"      (fallback: '—')
 */
export function formatDate(
  date: Date | null | undefined,
  style: 'long' | 'short' = 'long',
): string {
  if (!date) return style === 'short' ? '—' : ''
  if (style === 'short') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/** Format a number with "k" suffix above 999. */
export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
