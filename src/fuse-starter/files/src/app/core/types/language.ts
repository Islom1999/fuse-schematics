export const LANGUAGES = ['en', 'tr'] as const

export type LanguageType = (typeof LANGUAGES)[number]

export function isLanguageType(value: string): value is LanguageType {
  return (LANGUAGES as readonly string[]).includes(value)
}
