const DEFAULT_ALLOWED_ORIGINS: string[] = (typeof import.meta !== 'undefined' && typeof (import.meta as any).env !== 'undefined' && (import.meta as any).env.VITE_ALLOWED_ORIGINS)
  ? String((import.meta as any).env.VITE_ALLOWED_ORIGINS).split(',').map((s: string) => s.trim()).filter(Boolean)
  : []

export function isSafeRedirect(href: string, allowedOrigins: string[] = DEFAULT_ALLOWED_ORIGINS): boolean {
  if (!href) return false
  const trimmed = String(href).trim()
  if (/^(javascript:|data:|vbscript:)/i.test(trimmed)) return false
  try {
    if (trimmed.startsWith('/')) return true
    const url = new URL(trimmed, window.location.origin)
    const { protocol, origin } = url
    if (protocol !== 'http:' && protocol !== 'https:') return false
    if (origin === window.location.origin) return true
    if (allowedOrigins.includes(origin)) return true
    return false
  } catch {
    return false
  }
}

export function normalizeRedirect(href: string, allowedOrigins: string[] = DEFAULT_ALLOWED_ORIGINS): string {
  return isSafeRedirect(href, allowedOrigins) ? href : '/'
}

export function isExternal(href: string): boolean {
  try {
    const url = new URL(String(href), window.location.origin)
    return url.origin !== window.location.origin
  } catch {
    return false
  }
}
