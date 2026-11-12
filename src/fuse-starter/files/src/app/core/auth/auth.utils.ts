function base64UrlToBytes(segment: string): Uint8Array {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * Reads the payload of a JWT without verifying it. Returns `null` when the token is not a
 * three-part token or the payload is not a JSON object.
 */
export function decodeJwtPayload(token: string | null | undefined): Record<string, unknown> | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3 || !parts[1]) return null
  try {
    const json = new TextDecoder('utf-8', { fatal: true }).decode(base64UrlToBytes(parts[1]))
    const payload: unknown = JSON.parse(json)
    return payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/**
 * True when there is no token, it has no numeric `exp`, or it expires within `offsetSeconds`.
 */
export function isTokenExpired(token: string | null | undefined, offsetSeconds = 0): boolean {
  const exp = decodeJwtPayload(token)?.['exp']
  if (typeof exp !== 'number') return true
  return exp * 1000 < Date.now() + offsetSeconds * 1000
}
