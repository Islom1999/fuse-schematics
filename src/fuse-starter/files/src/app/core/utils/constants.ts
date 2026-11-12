import { LanguageType } from '../types/language'

export class Constants {
  static readonly DEFAULT_LANGUAGE: { code: LanguageType; label: string } = {
    code: 'en',
    label: 'English',
  }
}
