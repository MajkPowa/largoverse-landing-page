export type Currency =
  | 'CZK'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'CHF'
  | 'PLN'
  | 'VES'
  | 'XSGD'
  | 'USDT'
  | 'USDC'
  | 'EURC'

/** Klasické měny — nabízejí se u zůstatků vedených v penězích. */
export const FIAT_CURRENCIES: Currency[] = ['CZK', 'EUR', 'USD', 'GBP', 'CHF', 'PLN', 'VES']

/**
 * Stablecoiny, se kterými aplikace opravdu pracuje.
 *
 * Jediný. XSGD nese celý příběh: je vázaný na singapurský dolar, má proti
 * ostatním tokenům likviditu a transparentnost a jeho kotvou je stát
 * s ratingem AAA. Safe Money je vedené výhradně v něm.
 */
export const STABLECOINS: Currency[] = ['XSGD']

/**
 * Tokeny, které se teprve zvažují.
 *
 * V UI se ukazují průhledně a nejdou vybrat — má být vidět, že o nich víme,
 * a zároveň že nejsou součástí nabídky. Důvod není technický: každý další
 * token znamená vlastní AML dohled a vlastní posouzení podle MiCA
 * (USDC a EURC autorizované jsou, USDT ne). Do žádného výpočtu nevstupují.
 */
export const CONSIDERED_TOKENS: Currency[] = ['USDT', 'USDC', 'EURC']

/** Je token jen ve zvažování? Pak se nesmí dát vybrat. */
export function isConsidered(c: Currency): boolean {
  return CONSIDERED_TOKENS.includes(c)
}

/**
 * Vše, co se v nabídce ukáže. Zvažované tokeny jsou v seznamu schválně —
 * mají být vidět jako průhledné, ne zamlčené.
 */
export const DISPLAY_CURRENCIES: Currency[] = [
  ...FIAT_CURRENCIES,
  ...STABLECOINS,
  ...CONSIDERED_TOKENS,
]

/**
 * Měny, které klient v ukázce skutečně drží — jen mezi nimi jde směňovat.
 * Nabízet směnu do měny, kterou nikde nevedeme, by byla slepá ulička.
 */
export const EXCHANGEABLE: Currency[] = ['CZK', 'EUR', 'USD', 'VES', 'XSGD']

export type AccountKind = 'czk' | 'usd' | 'eur'

export interface Account {
  id: string
  kind: AccountKind
  currency: Currency
  number: string
  iban: string
  bic: string
  balance: number
}

export type CardState = 'active' | 'locked'

export interface CardLimits {
  merchant: number
  cash: number
  internet: number
}

export interface Card {
  id: string
  accountId: string
  currency: Currency
  brand: 'VISA'
  number: string
  last4: string
  expiry: string
  holder: string
  cvv: string
  pin: string
  state: CardState
  limits: CardLimits
  cancelled: boolean
}

export type TxKind =
  | 'transfer'
  | 'incoming'
  | 'card'
  | 'restaurant'
  | 'groceries'
  | 'transport'
  | 'subscription'
  | 'atm'
  | 'exchange'
  | 'crypto'
  | 'vault'
  | 'fee'

/** Klíče do slovníku, které smí stát jako podtitulek transakce. */
export type TxSubtitle =
  | 'defaultPayment'
  | 'paymentSent'
  | 'exchangeDone'
  | 'bought'
  | 'moved'
  | 'catRestaurant'
  | 'catGroceries'
  | 'catTransport'
  | 'catSubscription'
  | 'catAtm'
  | 'catCard'
  | 'catSalary'
  | 'catRent'
  | 'catRefund'
  | 'catFee'
  | 'catP2P'

export interface Tx {
  id: string
  accountId: string
  title: string
  subtitleKey: TxSubtitle
  kind: TxKind
  amount: number
  currency: Currency
  /** ISO datum (YYYY-MM-DD) */
  date: string
  /** Pořadí v rámci dne — drží stabilní řazení u plateb zadaných během ukázky. */
  seq?: number
  /** Zpráva pro příjemce, pokud ji uživatel vyplnil. */
  note?: string
}

/** Kontakt pro P2P — prezentující nemusí vypisovat e-mail z hlavy. */
export interface Contact {
  id: string
  name: string
  email: string
  initials: string
}

/** Uložený příjemce / šablona platby. */
export interface Payee {
  id: string
  name: string
  accountNumber: string
  currency: Currency
  /** Předvyplněná částka, pokud jde o pravidelnou platbu. */
  amount?: number
  noteKey?: TxSubtitle
}

export interface AppNotification {
  id: string
  title: string
  body: string
  date: string
  read: boolean
}

/** Kurzy vůči CZK — jedno místo pravdy pro celou simulaci. */
/**
 * Přepočet na koruny. ILUSTRATIVNÍ hodnoty pro ukázku, ne tržní kurzy —
 * v UI je u nich vždy vidět, že jsou nezávazné (klíč rateDisclaimer).
 */
export const RATES_TO_CZK: Record<Currency, number> = {
  CZK: 1,
  USD: 21.92,
  EUR: 25.1,
  GBP: 29.2,
  CHF: 27.4,
  PLN: 5.9,
  XSGD: 17.6,
  // Zvažované tokeny — kurz tu je jen kvůli úplnosti typu, nikde se nepoužije,
  // protože je nejde vybrat.
  USDT: 21.92,
  USDC: 21.92,
  EURC: 25.1,
  /*
   * STŘEDOVÝ kurz, ne ten, který dostane klient. Kdyby tu byl kurz včetně
   * spreadu (0,00023 × 17,6), strhl by se spread na páru VES↔XSGD dvakrát —
   * jednou skrytě v tomhle čísle a podruhé v exchangeAny.
   */
  VES: 0.0002335 * 17.6,
}

/**
 * Směna VES ⇄ XSGD.
 *
 * Návrh uvádí kurz 1 VES = 0.00023 XSGD a pod ním „Spread: 1,5 % (započítáno v kurzu)".
 * Aby to byla pravda a ne jen popisek, počítá se se středovým kurzem, ze kterého se
 * spread na obě strany opravdu odečítá — směna tam a zpět je proto ztrátová.
 */
export const SPREAD = 0.015
/** Kurz, který klient dostane při prodeji VES — tedy číslo z návrhu. */
export const VES_TO_XSGD = 0.00023
/** Střed, ze kterého se spread odvozuje. */
export const VES_XSGD_MID = VES_TO_XSGD / (1 - SPREAD)

export type ExchangeDirection = 'vesToXsgd' | 'xsgdToVes'

/** Kolik jednotek cílové měny klient dostane za 1 jednotku zdrojové. */
export function exchangeRate(direction: ExchangeDirection): number {
  return direction === 'vesToXsgd'
    ? VES_XSGD_MID * (1 - SPREAD)
    : 1 / (VES_XSGD_MID * (1 + SPREAD))
}

export const TRANSFER_FEE_CZK = 50

/*
 * Pozn.: dřív tu byla konstanta VAULT_RATE = 2,4 % p. a. a obrazovka Úschova
 * hlásila „Zhodnocení 2,4 % p. a. (simulace)". Odstraněno po právní rešerši:
 * subjekt bez licence nesmí slibovat výnos z odložených prostředků
 * (§ 2 odst. 1 zák. č. 21/1992 Sb., čl. 50 MiCA zakazuje úročení EMT)
 * a dovětek „(simulace)" to nezhojí. Oddělená část zůstatku nenese žádný výnos.
 * Nevracet zpět bez písemného stanoviska právníka.
 */

export function convert(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount
  return (amount * RATES_TO_CZK[from]) / RATES_TO_CZK[to]
}
