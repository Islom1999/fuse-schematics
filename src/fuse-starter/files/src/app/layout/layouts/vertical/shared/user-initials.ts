/** Up to two initials from a display name, e.g. "Jane Doe" -> "JD". Empty for a blank name. */
export function userInitials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return ''
  const first = parts[0].charAt(0)
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ''
  return (first + last).toLocaleUpperCase()
}
