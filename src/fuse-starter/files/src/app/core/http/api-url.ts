/** Joins the API base URL and a relative path with exactly one slash. */
export function joinApiUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}
