import { describe, expect, it } from 'bun:test'
import { formatDate, formatNumber } from './format'

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  const JAN_15 = new Date(2025, 0, 15) // Jan 15 2025

  it('returns empty string for null in long style', () => {
    expect(formatDate(null, 'long')).toBe('')
  })

  it('returns em-dash for null in short style', () => {
    expect(formatDate(null, 'short')).toBe('—')
  })

  it('returns empty string for undefined in long style', () => {
    expect(formatDate(undefined)).toBe('')
  })

  it('returns em-dash for undefined in short style', () => {
    expect(formatDate(undefined, 'short')).toBe('—')
  })

  it('defaults to long style', () => {
    expect(formatDate(JAN_15)).toBe('January 15, 2025')
  })

  it('formats long style as "Month Day, Year" in en-US', () => {
    expect(formatDate(JAN_15, 'long')).toBe('January 15, 2025')
  })

  it('formats short style as "Mon Day, Year" in en-US', () => {
    expect(formatDate(JAN_15, 'short')).toBe('Jan 15, 2025')
  })
})

// ─── formatNumber ─────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('returns the number as a string below 1000', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(1)).toBe('1')
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

  it('rounds to one decimal place', () => {
    // 1050 → 1.05 → toFixed(1) → "1.1"
    expect(formatNumber(1050)).toBe('1.1k')
  })
})
