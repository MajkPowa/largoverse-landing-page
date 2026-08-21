import { cs, type Dict } from './cs'
import { en } from './en'
import { es } from './es'

export type Lang = 'cs' | 'en' | 'es'

export const dictionaries: Record<Lang, Dict> = { cs, en, es }

export const languages: { code: Lang; label: string; flag: string }[] = [
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
]

/** Locale používaná pro formátování čísel a dat. */
export const locales: Record<Lang, string> = {
  cs: 'cs-CZ',
  en: 'en-GB',
  es: 'es-ES',
}

/** Přeloží klíč a doplní {placeholdery}. */
export function translate(lang: Lang, key: keyof Dict, vars?: Record<string, string | number>) {
  const raw = dictionaries[lang][key] ?? dictionaries.cs[key] ?? String(key)
  if (!vars) return raw
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    raw as string,
  )
}

export type { Dict }
