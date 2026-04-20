import { describe, expect, it } from 'bun:test'
import { formatDate, formatNumber } from './format'

// ─── formatDate (client) ──────────────────────────────────────────────────────
// Differences from the server version:
//   - Accepts ISO string input in addition to Date
//   - Uses es-ES locale
//   - Returns '' for null/undefined in both styles (no '—' fallback)
//   - Returns '' for invalid dates

describe('formatDate', () => {
  const JAN_15 = new Date(2025, 0, 15) // Jan 15 2025 (local time)
  const JAN_15_ISO = '2025-01-15T00:00:00.000Z'

  // Helper: what the es-ES locale actually produces — avoids hard-coding
  const long = (d: Date) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  const short = (d: Date) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(null, 'short')).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('')
    expect(formatDate(undefined, 'short')).toBe('')
  })

  it('returns empty string for an invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('')
  })

  it('formats a Date object in long style (es-ES)', () => {
    expect(formatDate(JAN_15, 'long')).toBe(long(JAN_15))
  })

  it('formats a Date object in short style (es-ES)', () => {
    expect(formatDate(JAN_15, 'short')).toBe(short(JAN_15))
  })

  it('accepts an ISO string and formats it', () => {
    const parsed = new Date(JAN_15_ISO)
    expect(formatDate(JAN_15_ISO, 'long')).toBe(long(parsed))
  })

  it('defaults to long style', () => {
    expect(formatDate(JAN_15)).toBe(long(JAN_15))
  })
})

// ─── formatNumber ─────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('returns the number as a string below 1000', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(999)).toBe('999')
  })

  it('adds a "k" suffix at exactly 1000', () => {
    expect(formatNumber(1000)).toBe('1.0k')
  })

  it('formats 1200 as "1.2k"', () => {
    expect(formatNumber(1200)).toBe('1.2k')
  })

  it('formats 10000 as "10.0k"', () => {
    expect(formatNumber(10000)).toBe('10.0k')
  })
})
