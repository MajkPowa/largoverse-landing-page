import { locales, type Lang } from '../i18n'
import type { Currency } from '../domain/types'

/** [min, max] desetinných míst; crypto se zobrazuje bez zbytečných nul. */
const DECIMALS: Partial<Record<Currency, [number, number]>> = {
  // XSGD se drží na čtyři desetinná místa — kdyby se zobrazoval jen na dvě,
  // malý nákup by vypadal, že se vůbec nestal.
  XSGD: [0, 4],
  USDT: [0, 4],
  USDC: [0, 4],
  EURC: [0, 4],
  VES: [0, 0],
}

/**
 * „37 129,64 CZK" – měna se píše za číslem stejně jako v návrhu.
 *
 * `signed` přidá i plus u kladných hodnot. Používá se v historii, kde znaménko
 * nese směr pohybu; u zůstatků by plus působilo divně.
 */
export function money(value: number, currency: Currency, lang: Lang, signed = false): string {
  const [min, max] = DECIMALS[currency] ?? [2, 2]
  const n = new Intl.NumberFormat(locales[lang], {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(Math.abs(value))
  const sign = value < 0 ? '− ' : signed && value > 0 ? '+ ' : ''
  return `${sign}${n} ${currency}`
}

/** Jen číslo, bez kódu měny — když je kód vedle v přepínači. */
export function amountOnly(value: number, currency: Currency, lang: Lang): string {
  const [min, max] = DECIMALS[currency] ?? [2, 2]
  const n = new Intl.NumberFormat(locales[lang], {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(Math.abs(value))
  return value < 0 ? `− ${n}` : n
}

/** Bez měny, pro velká pole s částkou. */
export function number(value: number, lang: Lang, decimals = 2): string {
  return new Intl.NumberFormat(locales[lang], {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function shortDate(iso: string, lang: Lang): string {
  const d = new Date(`${iso}T00:00:00`)
  return new Intl.DateTimeFormat(locales[lang], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function monthLabel(iso: string, lang: Lang): string {
  const d = new Date(`${iso}T00:00:00`)
  const s = new Intl.DateTimeFormat(locales[lang], { month: 'long', year: 'numeric' }).format(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function groupByMonth<T extends { date: string }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>()
  for (const item of [...items].sort((a, b) => (a.date < b.date ? 1 : -1))) {
    const key = item.date.slice(0, 7)
    const bucket = map.get(key)
    if (bucket) bucket.push(item)
    else map.set(key, [item])
  }
  return [...map.entries()]
}

/** Vstup z numerické klávesnice na číslo (pracuje s halíři). */
export function digitsToAmount(digits: string): number {
  if (!digits) return 0
  return Number(digits) / 100
}
