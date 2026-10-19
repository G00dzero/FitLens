export function sanitizeString(input: unknown, maxLength = 1024): string {
  if (input == null) return ''
  let s = String(input)
  try {
    // decode if encoded; ignore errors
    s = decodeURIComponent(s)
  } catch {}
  // remove control chars, newlines, and excessive length
  s = s.replace(/[\x00-\x1F\x7F]/g, '')
  if (s.length > maxLength) s = s.slice(0, maxLength)
  return s
}

export function getQueryParamSafe(name: string, validator?: (v: string) => boolean): string | null {
  try {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get(name)
    if (raw == null) return null
    // Reject if decoding produces control characters (defensive)
    try {
      const decoded = decodeURIComponent(raw)
      if (/[\x00-\x1F\x7F]/.test(decoded)) return null
    } catch {
      // If decoding fails, treat as invalid
      return null
    }
    const clean = sanitizeString(raw)
    if (validator && !validator(clean)) return null
    return clean
  } catch {
    return null
  }
}

export function parseHashParams(): Record<string, string> {
  try {
    const hash = (window.location.hash || '').replace(/^#/, '')
    const params = new URLSearchParams(hash)
    const out: Record<string, string> = {}
    for (const [k, v] of params.entries()) {
      out[k] = sanitizeString(v)
    }
    return out
  } catch {
    return {}
  }
}
