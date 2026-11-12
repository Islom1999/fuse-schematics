/** Layout of the search widget: `bar` is an icon that expands over the header, `basic` an always-visible input. */
export type SearchAppearance = 'bar' | 'basic'

/** One hit. Which fields are set depends on the set's `id` (`pages`, `contacts`, `tasks` or other). */
export interface SearchResult {
  id: string
  /** Router URL to navigate to. */
  link: string
  /** Text placed in the input on selection. */
  value: string
  /** Pages and tasks. */
  title?: string
  /** Contacts. */
  name?: string
  /** Contacts. */
  avatar?: string
  /** Tasks. */
  completed?: boolean
}

/** A group of hits, as returned by `POST /search`. */
export interface SearchResultSet {
  /** Template key: `contacts`, `pages`, `tasks`, or any other id for the generic row. */
  id: string
  /** Group header text. */
  label: string
  results: SearchResult[]
}
