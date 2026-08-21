import { INFLATION } from './inflation'
import { TRANSFER_FEE_CZK, type Currency } from './types'

/**
 * Sazebník podle toho, v jakém stavu je ekonomika měny.
 *
 * Zadání klienta (16. 8. 2026): v zemích s velmi vysokou inflací jen spread
 * 1,5 % a žádný další poplatek. Mimo ně se spread pohybuje a poplatky se
 * naopak přidávají, protože ekonomika v takovém stavu není. Platí to i tehdy,
 * když peníze do postižené země posílá někdo zvenčí.
 *
 * POZOR: standardní spread je zatím převzatý z hyperinflační sazby, protože
 * klient pro něj vlastní číslo nedodal. Než ho dá, není to jeho sazebník —
 * je to zástupná hodnota. Nevydávat ji za konečnou.
 */

/**
 * Hranice, od které se měna bere jako hyperinflační.
 *
 * Účetní standard IAS 29 mluví o kumulativní inflaci blížící se 100 % za tři
 * roky. Tady se pracuje s jedním ročním číslem, protože víc dat v ukázce není;
 * 50 % ročně je vůči tříletému kritériu konzervativní odhad. Až přibude řada
 * za tři roky, má se to nahradit kumulativním výpočtem podle IAS 29.
 */
export const HYPERINFLATION_ANNUAL = 50

export function isHyperinflation(currency: Currency): boolean {
  const point = INFLATION[currency]
  return point ? point.annual >= HYPERINFLATION_ANNUAL : false
}

export type TariffKey = 'hyper' | 'standard'

export interface Tariff {
  key: TariffKey
  /** Rozpětí započítané do kurzu. */
  spread: number
  /** Pevný poplatek v CZK. 0 = žádný. */
  feeCzk: number
}

export const TARIFFS: Record<TariffKey, Tariff> = {
  hyper: { key: 'hyper', spread: 0.015, feeCzk: 0 },
  // TODO: doplnit spread podle klienta — 0,015 je jen dočasně převzaté.
  standard: { key: 'standard', spread: 0.015, feeCzk: TRANSFER_FEE_CZK },
}

/**
 * Která sazba na operaci platí.
 *
 * Stačí, aby hyperinflační byla JEDNA strana — když někdo posílá peníze do
 * postižené země, má platit tamní, výhodnější sazbu.
 */
export function tariffFor(from: Currency, to: Currency): Tariff {
  return isHyperinflation(from) || isHyperinflation(to) ? TARIFFS.hyper : TARIFFS.standard
}
