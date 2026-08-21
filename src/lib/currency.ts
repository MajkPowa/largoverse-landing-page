import { locales, type Dict, type Lang } from '../i18n'
import { isConsidered, STABLECOINS, type Currency } from '../domain/types'

/** Kód měny → klíč s jejím názvem ve slovníku. */
const NAME_KEYS: Record<Currency, keyof Dict> = {
  CZK: 'curCZK',
  EUR: 'curEUR',
  USD: 'curUSD',
  GBP: 'curGBP',
  CHF: 'curCHF',
  PLN: 'curPLN',
  VES: 'curVES',
  XSGD: 'curXSGD',
  USDT: 'curUSDT',
  USDC: 'curUSDC',
  EURC: 'curEURC',
}

export function currencyName(c: Currency, t: (k: keyof Dict) => string): string {
  return t(NAME_KEYS[c])
}

/**
 * Nabídka měn rozdělená na peníze a stablecoiny, uvnitř seřazená podle
 * názvu v jazyce, který má uživatel zapnutý.
 *
 * Řadí se podle názvu, ne podle kódu — v seznamu je vidět „Česká koruna",
 * takže „CHF před CZK" by uživateli přišlo jako náhodné pořadí. Skupina
 * s jediným prvkem se nevypisuje s nadpisem, ať se seznam nedrobí.
 */
export type CurrencyGroupKey = 'groupFiat' | 'groupStable' | 'groupConsidered'

export function currencyGroups(
  options: Currency[],
  t: (k: keyof Dict) => string,
  lang: Lang,
): { key: CurrencyGroupKey; label: string; items: Currency[]; considered?: boolean }[] {
  const collator = new Intl.Collator(locales[lang])
  const sort = (list: Currency[]) =>
    [...list].sort((a, b) => collator.compare(currencyName(a, t), currencyName(b, t)))

  const fiat = sort(options.filter((c) => !STABLECOINS.includes(c) && !isConsidered(c)))
  const stable = sort(options.filter((c) => STABLECOINS.includes(c)))
  // Zvažované tokeny jdou naspod a v UI se kreslí průhledně.
  const considered = sort(options.filter((c) => isConsidered(c)))

  return [
    { key: 'groupFiat' as const, label: t('groupFiat'), items: fiat },
    { key: 'groupStable' as const, label: t('groupStable'), items: stable },
    { key: 'groupConsidered' as const, label: t('groupConsidered'), items: considered, considered: true },
  ].filter((g) => g.items.length > 0)
}
