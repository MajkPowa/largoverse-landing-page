import type { Currency } from './types'

/**
 * Roční inflace jednotlivých měn — ZMRAZENÝ SNÍMEK.
 *
 * Každé číslo ověřily dvě nezávislé rešerše proti webu statistického úřadu
 * nebo centrální banky. U každého je uvedeno, za jaké období platí a odkud je;
 * to musí být vidět i v UI, jinak jde o nedoložené tvrzení.
 *
 * Pravidla, která se tu NESMÍ porušit:
 *  1. Číslo se nesmí změnit bez uvedení nového zdroje a data.
 *  2. Nikde se nesmí prezentovat jako výnos, úrok ani předpověď.
 *     Je to rozdíl v udržení kupní síly podle ZVEŘEJNĚNÉ minulé inflace.
 *  3. U Venezuely se nesmí uvést jediné číslo bez rozpětí — oficiální BCV
 *     a nezávislé odhady se liší o víc než 140 procentních bodů.
 *  4. Na OBOU stranách srovnání musí stát CELKOVÁ inflace (all items).
 *     Jádrová se do výpočtu nesmí dostat — viz SGD_CORE níž.
 */

export interface InflationPoint {
  /** Meziroční inflace v procentech. */
  annual: number
  /** Za jaké období údaj platí, YYYY-MM. */
  asOf: string
  /** Kdo ho zveřejnil. */
  source: string
  /**
   * Který ukazatel to je. Drží se tu proto, aby při příští aktualizaci
   * nikdo omylem nevzal jádrové číslo — jádro a celek se míchat nesmí.
   */
  measure: 'headline'
  /** Horní hranice, pokud se odhady výrazně rozcházejí. */
  altAnnual?: number
  altSource?: string
}

export const INFLATION: Partial<Record<Currency, InflationPoint>> = {
  CZK: { annual: 1.7, asOf: '2026-07', source: 'ČSÚ', measure: 'headline' },
  EUR: { annual: 2.9, asOf: '2026-07', source: 'Eurostat', measure: 'headline' },
  USD: { annual: 3.4, asOf: '2026-07', source: 'BLS', measure: 'headline' },
  GBP: { annual: 2.6, asOf: '2026-06', source: 'ONS', measure: 'headline' },
  CHF: { annual: 0.4, asOf: '2026-07', source: 'BFS', measure: 'headline' },
  PLN: { annual: 3.0, asOf: '2026-07', source: 'GUS', measure: 'headline' },
  VES: {
    annual: 595.96,
    asOf: '2026-07',
    source: 'BCV',
    measure: 'headline',
    altAnnual: 738.79,
    altSource: 'CEDICE',
  },
}

/**
 * XSGD je token navázaný na singapurský dolar, takže jeho kupní sílu
 * určuje singapurská inflace — ne vlastnost tokenu.
 *
 * Používá se CPI All-Items (celková), protože na druhé straně srovnání
 * stojí taky celková inflace. Viz SGD_CORE.
 */
export const XSGD_ANCHOR: InflationPoint & { anchorCurrency: string } = {
  annual: 1.9,
  asOf: '2026-06',
  source: 'CPI All-Items, DOS / MAS',
  measure: 'headline',
  anchorCurrency: 'SGD',
}

/**
 * MAS Core Inflation — jen jako kontext, do výpočtu NEVSTUPUJE.
 *
 * MAS z koše vyndává ubytování a soukromou silniční dopravu; u ubytování
 * proto, že většina Singapurců bydlí ve vlastním a jde hlavně o imputované
 * nájemné, u dopravy proto, že cenu určuje aukce certifikátů COE.
 * Slouží k nastavení měnové politiky, ne k popisu životních nákladů.
 *
 * Kdyby se dosadila sem místo celkové inflace, kotva by se uměle snížila
 * a rozdíl ve prospěch XSGD by vyšel větší. Zkreslení by tedy šlo
 * systematicky ve prospěch prodávaného produktu — přesně to, co u finanční
 * komunikace neobstojí. Do purchasingPowerGap se nesmí dostat.
 */
export const SGD_CORE = {
  annual: 1.6,
  asOf: '2026-06',
  source: 'MAS Core Inflation',
  excludes: 'ubytování a soukromá silniční doprava',
} as const

/**
 * Zachovaná hodnota podle jádrové inflace — jen jako doplněk, aby bylo vidět
 * číslo, ne jen zmínka. Do hlavního srovnání NEVSTUPUJE; kdyby ano, kotva by
 * vyšla lépe (98,4 % místo 98,1 %) a rozdíl ve prospěch produktu by se nafoukl.
 */
export function coreRetained(): number {
  return retainedValue(SGD_CORE.annual)
}

/**
 * Kolik procent kupní síly zůstalo z částky držené dvanáct měsíců v dané měně,
 * podle ZVEŘEJNĚNÉ inflace. 100 / (1 + inflace).
 *
 * Tohle je ta veličina, o kterou v Safe Money jde: uchování hodnoty.
 * U bolívaru vychází 14 %, u singapurského dolaru 98 %.
 */
export function retainedValue(annual: number): number {
  return 100 / (1 + annual / 100)
}

/** Zachovaná hodnota kotvy — společný jmenovatel všech srovnání. */
export function anchorRetained(): number {
  return retainedValue(XSGD_ANCHOR.annual)
}

/** Zachovaná hodnota dané měny, nebo null, když pro ni nemáme ověřený údaj. */
export function currencyRetained(currency: Currency): number | null {
  const point = INFLATION[currency]
  return point ? retainedValue(point.annual) : null
}

/**
 * Kolikrát víc hodnoty zůstalo v XSGD než v dané měně.
 *
 * Je to tentýž fakt jako dřívější procentní rozdíl, jen řečený jako uchování
 * hodnoty, ne jako zisk. „+583 %" pod zůstatkem vypadá jako výnos ve stovkách
 * procent a to je přesně to slovo, které se u e-money tokenu podle čl. 50 MiCA
 * použít nesmí. „Zůstalo 14 % proti 98 %, tedy 6,8×" nese stejné číslo,
 * neslibuje nic a je doložitelné zveřejněnou inflací.
 *
 * Nezahrnuje pohyb kurzu ani poplatky. U měn s nízkou inflací je obojí větší
 * než celý spočítaný rozdíl — proto se u nich násobek neukazuje.
 */
export function retentionRatio(currency: Currency): number | null {
  const mine = currencyRetained(currency)
  if (mine === null || mine === 0) return null
  return anchorRetained() / mine
}

/**
 * Původní procentní rozdíl. Zůstává jen pro doplňkový výpočet a testy —
 * v UI se pod zůstatek nedává, protože se čte jako výnos.
 */
export function purchasingPowerGap(currency: Currency): number | null {
  const point = INFLATION[currency]
  if (!point) return null
  return ((1 + XSGD_ANCHOR.annual / 100) / (1 + point.annual / 100) - 1) * 100
}

/**
 * Pod tímhle rozdílem se číslo neukazuje.
 *
 * U koruny vychází rozdíl ~0,2 p. b. To je míň než spread, který si aplikace
 * sama účtuje (1,5 %), míň než roční pohyb kurzu CZK/SGD a míň než rozdíl
 * daný tím, že každý statistický úřad měří jiný spotřební koš. Tvrdit z toho
 * cokoli o kupní síle by bylo vydávání šumu za informaci.
 *
 * Srovnání dává smysl tam, kde inflační rozdíl řádově převyšuje kurzový šum
 * i náklady — tedy u měn s vysokou inflací, kvůli kterým celá úschova vzniká.
 */
export const MEANINGFUL_GAP = 5

/**
 * Násobek, od kterého se vůbec vyplatí o uchování hodnoty mluvit.
 * 1,05 odpovídá zhruba pětiprocentnímu rozdílu — tedy víc než spread
 * i než běžný roční pohyb kurzu.
 */
export const MEANINGFUL_RATIO = 1.05

/** Je rozdíl dost velký na to, aby se dal vůbec ukázat? */
export function gapIsMeaningful(currency: Currency): boolean {
  const gap = purchasingPowerGap(currency)
  return gap !== null && Math.abs(gap) >= MEANINGFUL_GAP
}

/**
 * Ze zadaných měn ta, u které má úschova nejsilnější důvod — tedy ta, která
 * proti kotvě ztratila nejvíc. Používá se jako výchozí volba v trezoru, aby
 * prezentující nemusel hledat, na které měně je efekt vidět.
 *
 * Vrací null, když žádná z měn ověřený údaj o inflaci nemá.
 */
export function mostAffectedCurrency(candidates: Currency[]): Currency | null {
  let best: Currency | null = null
  let worst = 0
  for (const c of candidates) {
    const gap = purchasingPowerGap(c)
    if (gap === null || gap >= worst) continue
    worst = gap
    best = c
  }
  return best
}

/** „7/2026" — krátký zápis období pro popisek pod číslem. */
export function periodLabel(asOf: string): string {
  const [year, month] = asOf.split('-')
  return `${Number(month)}/${year}`
}

/**
 * Index kupní síly v čase — 100 na začátku období, klesá podle roční inflace.
 *
 * Mezikroky se dopočítávají rovnoměrným měsíčním tempem, protože měsíční řadu
 * pro všechny sledované měny nikdo nezveřejňuje. Krajní body odpovídají
 * zveřejněným datům; průběh mezi nimi je odvozený a musí to být v UI napsané.
 */
export function retainedIndex(annual: number, step: number, steps: number): number {
  return 100 / Math.pow(1 + annual / 100, step / steps)
}

/**
 * Rozdíl obou inflací v procentních bodech.
 *
 * Tohle je veřejná statistika, ne tvrzení o produktu: rozdíl dvou zveřejněných
 * měr. Na rozdíl od poměru se nedá číst jako výnos, protože procentní bod není
 * jednotka zhodnocení.
 */
export function inflationGapPoints(currency: Currency): number | null {
  const point = INFLATION[currency]
  if (!point) return null
  return point.annual - XSGD_ANCHOR.annual
}
