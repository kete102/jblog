import { describe, expect, it } from 'bun:test'
import { getClientIp } from './request'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ctx(headers: Record<string, string | undefined>) {
  return { req: { header: (key: string) => headers[key] } }
}

// ─── getClientIp ──────────────────────────────────────────────────────────────

describe('getClientIp', () => {
  it('returns the first IP from x-forwarded-for', () => {
    expect(getClientIp(ctx({ 'x-forwarded-for': '1.2.3.4' }))).toBe('1.2.3.4')
  })

  it('returns the first IP when x-forwarded-for contains multiple IPs', () => {
    expect(getClientIp(ctx({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12' }))).toBe('1.2.3.4')
  })

  it('trims whitespace from the first IP in x-forwarded-for', () => {
    expect(getClientIp(ctx({ 'x-forwarded-for': '  1.2.3.4  , 5.6.7.8' }))).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    expect(getClientIp(ctx({ 'x-real-ip': '9.9.9.9' }))).toBe('9.9.9.9')
  })

  it('returns "0.0.0.0" when no proxy headers are present', () => {
    expect(getClientIp(ctx({}))).toBe('0.0.0.0')
  })

  it('prefers x-forwarded-for over x-real-ip', () => {
    expect(getClientIp(ctx({ 'x-forwarded-for': '1.1.1.1', 'x-real-ip': '2.2.2.2' }))).toBe(
      '1.1.1.1',
    )
  })
})
