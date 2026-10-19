import { describe, it, expect, beforeEach } from 'vitest'
import { isSafeRedirect, normalizeRedirect } from '../url'
import { sanitizeString, getQueryParamSafe, parseHashParams } from '../params'

beforeEach(() => {
  // ensure a predictable origin for the tests — work in Node (no window) and jsdom
  // @ts-ignore
  if (typeof window === 'undefined') {
    // @ts-ignore
    global.window = { location: { origin: 'http://localhost', search: '', hash: '' } }
  } else {
    // set a stable location in jsdom without overwriting the window object
    try {
      window.history.pushState({}, '', 'http://localhost/')
      window.location.hash = ''
      window.location.search = ''
    } catch {
      // fallback: try to replace the property if possible
      try {
        // @ts-ignore
        Object.defineProperty(window, 'location', { value: { origin: 'http://localhost', search: '', hash: '' }, configurable: true })
      } catch {
        // last resort: do nothing
      }
    }
  }
})

describe('isSafeRedirect', () => {
  it('blocks javascript: and data: urls', () => {
    expect(isSafeRedirect('javascript:alert(1)')).toBe(false)
    expect(isSafeRedirect('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe(false)
  })

  it('allows relative paths', () => {
    expect(isSafeRedirect('/some/path')).toBe(true)
  })

  it('allows same-origin absolute urls', () => {
    expect(isSafeRedirect('http://localhost/profile')).toBe(true)
  })

  it('blocks unknown external origins', () => {
    expect(isSafeRedirect('https://evil.example.com/')).toBe(false)
  })

  it('respects allowedOrigins', () => {
    expect(isSafeRedirect('https://good.example.com/', ['https://good.example.com'])).toBe(true)
  })
})

describe('normalizeRedirect', () => {
  it('normalizes unsafe targets to root', () => {
    expect(normalizeRedirect('javascript:bad()')).toBe('/')
  })
})

describe('params sanitization', () => {
  it('sanitizes long strings and control chars', () => {
    const long = 'a'.repeat(2000) + '\u0000\u0001'
    const s = sanitizeString(long, 100)
    expect(s.length).toBeLessThanOrEqual(100)
    expect(s).not.toContain('\u0000')
  })

  it('getQueryParamSafe returns null for invalid', () => {
    // @ts-ignore
    global.window.location.search = '?q=%00bad'
    const v = getQueryParamSafe('q', (x) => /^[a-z0-9]+$/i.test(x))
    expect(v).toBeNull()
  })

  it('parseHashParams parses and sanitizes', () => {
    // @ts-ignore
    global.window.location.hash = '#a=1&b=two'
    const h = parseHashParams()
    expect(h.a).toBe('1')
    expect(h.b).toBe('two')
  })
})
