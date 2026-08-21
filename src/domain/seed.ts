import type {
  Account,
  AppNotification,
  Card,
  Contact,
  Currency,
  Payee,
  Tx,
  TxKind,
  TxSubtitle,
} from './types'

/**
 * Demo data.
 *
 * Pravidla, která se tu NESMÍ porušit — plynou z právní revize:
 *  1. Žádný název nesmí připomínat existující ani zaniklou firmu, banku či pojišťovnu.
 *     Protistrany jsou vymyšlené a neutrální.
 *  2. Osoby jsou uvedené jen příjmením a iniciálou, stejně jako v návrhu.
 *     E-maily běží na doméně example.com, která je pro ukázky vyhrazená (RFC 2606).
 *  3. Identifikátory MUSÍ zůstat nevalidní: číslo účtu neprojde kontrolou ČNB (mod-11),
 *     IBAN neprojde mod-97 a číslo karty neprojde Luhnovou kontrolou.
 *     Kód banky 0000 a BIC ABCDEFGH ČNB nikomu nepřidělila. Neopravovat!
 *  4. Částky a kurzy jsou ilustrativní, ne ceník.
 */

export const HOLDER = 'Ondřej Veverka'
export const HOLDER_LATIN = 'Ondrej Veverka'

export const seedAccounts: Account[] = [
  {
    id: 'acc-czk',
    kind: 'czk',
    currency: 'CZK',
    number: '1234567890/0000',
    iban: 'CZ12 3456 7890 1234 5678 1234',
    bic: 'ABCDEFGH',
    balance: 37129.64,
  },
  {
    id: 'acc-usd',
    kind: 'usd',
    currency: 'USD',
    number: '1234567891/0000',
    iban: 'CZ12 3456 7890 1234 5678 5678',
    bic: 'ABCDEFGH',
    balance: 3129.64,
  },
  {
    id: 'acc-eur',
    kind: 'eur',
    currency: 'EUR',
    number: '1234567892/0000',
    iban: 'CZ12 3456 7890 1234 5678 9012',
    bic: 'ABCDEFGH',
    balance: 3129.64,
  },
]

export const seedCards: Card[] = [
  {
    id: 'card-czk',
    accountId: 'acc-czk',
    currency: 'CZK',
    brand: 'VISA',
    number: '1234 5678 1234 5678',
    last4: '4839',
    expiry: '02/28',
    holder: HOLDER_LATIN,
    cvv: '123',
    pin: '1234',
    state: 'active',
    limits: { merchant: 50000, cash: 20000, internet: 20000 },
    cancelled: false,
  },
  {
    id: 'card-usd',
    accountId: 'acc-usd',
    currency: 'USD',
    brand: 'VISA',
    number: '4321 8765 4321 8765',
    last4: '5127',
    expiry: '02/28',
    holder: HOLDER_LATIN,
    cvv: '456',
    pin: '4321',
    state: 'active',
    limits: { merchant: 2000, cash: 800, internet: 800 },
    cancelled: false,
  },
  {
    // Zamknutá karta — aby šlo předvést odemčení, ne jen zamčení.
    id: 'card-eur',
    accountId: 'acc-eur',
    currency: 'EUR',
    brand: 'VISA',
    number: '8765 4321 8765 4321',
    last4: '2244',
    expiry: '02/28',
    holder: HOLDER_LATIN,
    cvv: '789',
    pin: '5678',
    state: 'locked',
    limits: { merchant: 2000, cash: 800, internet: 800 },
    cancelled: false,
  },
]

/* --------------------------------------------------------------- kontakty */

export const seedContacts: Contact[] = [
  { id: 'c1', name: 'Svátoš M.', email: 'svatos@example.com', initials: 'SM' },
  { id: 'c2', name: 'Dvořáková T.', email: 'dvorakova@example.com', initials: 'DT' },
  { id: 'c3', name: 'Hruška P.', email: 'hruska@example.com', initials: 'HP' },
  { id: 'c4', name: 'Malá K.', email: 'mala@example.com', initials: 'MK' },
]

export const seedPayees: Payee[] = [
  {
    id: 'p1',
    name: 'Bytové družstvo Javorová',
    accountNumber: '2233445566/0000',
    currency: 'CZK',
    amount: 14500,
    noteKey: 'catRent',
  },
  {
    id: 'p2',
    name: 'Městská doprava',
    accountNumber: '3344556677/0000',
    currency: 'CZK',
    amount: 550,
    noteKey: 'catTransport',
  },
  {
    id: 'p3',
    name: 'Filmotéka Premium',
    accountNumber: '4455667788/0000',
    currency: 'CZK',
    amount: 279,
    noteKey: 'catSubscription',
  },
]

/* -------------------------------------------------------------- transakce */

type Row = {
  /** kolik dní zpět od dneška */
  ago: number
  title: string
  kind: TxKind
  subtitleKey: TxSubtitle
  amount: number
  accountId?: string
  currency?: Account['currency']
  note?: string
}

/**
 * Rozpis posledních ~4 měsíců. Různé protistrany, různé částky, příchozí
 * i odchozí, tři měny a pohyby peněženky — aby šel předvést každý filtr.
 */
const ROWS: Row[] = [
  // ---- tento měsíc
  { ago: 1, title: 'Kavárna U Lípy', kind: 'restaurant', subtitleKey: 'catRestaurant', amount: -168 },
  { ago: 1, title: 'Potraviny Zelený dvůr', kind: 'groceries', subtitleKey: 'catGroceries', amount: -1247.5 },
  { ago: 2, title: 'Filmotéka Premium', kind: 'subscription', subtitleKey: 'catSubscription', amount: -279 },
  { ago: 3, title: 'Svátoš M.', kind: 'transfer', subtitleKey: 'catP2P', amount: -1000, note: 'Za lístky' },
  { ago: 4, title: 'Městská doprava', kind: 'transport', subtitleKey: 'catTransport', amount: -550 },
  { ago: 5, title: 'Výběr hotovosti', kind: 'atm', subtitleKey: 'catAtm', amount: -3000 },
  { ago: 6, title: 'Dvořáková T.', kind: 'incoming', subtitleKey: 'catP2P', amount: 1240, note: 'Vratka za večeři' },
  { ago: 8, title: 'Knihkupectví Arkáda', kind: 'card', subtitleKey: 'catCard', amount: -689 },
  { ago: 9, title: 'Bytové družstvo Javorová', kind: 'transfer', subtitleKey: 'catRent', amount: -14500 },
  { ago: 10, title: 'Mzda', kind: 'incoming', subtitleKey: 'catSalary', amount: 48500 },
  { ago: 11, title: 'Restaurace Na Kopci', kind: 'restaurant', subtitleKey: 'catRestaurant', amount: -564 },
  { ago: 12, title: 'Potraviny Zelený dvůr', kind: 'groceries', subtitleKey: 'catGroceries', amount: -842.3 },

  // ---- minulý měsíc
  { ago: 34, title: 'Mzda', kind: 'incoming', subtitleKey: 'catSalary', amount: 48500 },
  { ago: 35, title: 'Bytové družstvo Javorová', kind: 'transfer', subtitleKey: 'catRent', amount: -14500 },
  { ago: 37, title: 'Filmotéka Premium', kind: 'subscription', subtitleKey: 'catSubscription', amount: -279 },
  { ago: 39, title: 'Kavárna U Lípy', kind: 'restaurant', subtitleKey: 'catRestaurant', amount: -142 },
  { ago: 41, title: 'Hruška P.', kind: 'transfer', subtitleKey: 'catP2P', amount: -2500, note: 'Půjčka' },
  { ago: 43, title: 'Potraviny Zelený dvůr', kind: 'groceries', subtitleKey: 'catGroceries', amount: -1580.9 },
  { ago: 45, title: 'Výběr hotovosti', kind: 'atm', subtitleKey: 'catAtm', amount: -2000 },
  { ago: 47, title: 'Elektro Podkova', kind: 'card', subtitleKey: 'catCard', amount: -4390 },

  // ---- předminulý měsíc
  { ago: 64, title: 'Mzda', kind: 'incoming', subtitleKey: 'catSalary', amount: 48500 },
  { ago: 65, title: 'Bytové družstvo Javorová', kind: 'transfer', subtitleKey: 'catRent', amount: -14500 },
  { ago: 68, title: 'Městská doprava', kind: 'transport', subtitleKey: 'catTransport', amount: -550 },
  { ago: 70, title: 'Malá K.', kind: 'incoming', subtitleKey: 'catP2P', amount: 1240, note: 'Podíl na dárku' },
  { ago: 73, title: 'Restaurace Na Kopci', kind: 'restaurant', subtitleKey: 'catRestaurant', amount: -1064 },
  { ago: 76, title: 'Potraviny Zelený dvůr', kind: 'groceries', subtitleKey: 'catGroceries', amount: -1122 },

  // ---- před třemi měsíci
  { ago: 94, title: 'Mzda', kind: 'incoming', subtitleKey: 'catSalary', amount: 48500 },
  { ago: 95, title: 'Bytové družstvo Javorová', kind: 'transfer', subtitleKey: 'catRent', amount: -14500 },
  { ago: 98, title: 'Filmotéka Premium', kind: 'subscription', subtitleKey: 'catSubscription', amount: -279 },
  { ago: 101, title: 'Kavárna U Lípy', kind: 'restaurant', subtitleKey: 'catRestaurant', amount: -196 },

  // ---- dolarový účet
  { ago: 7, title: 'Cloud úložiště', kind: 'subscription', subtitleKey: 'catSubscription', amount: -12.99, accountId: 'acc-usd', currency: 'USD' },
  { ago: 22, title: 'Konferenční vstupenka', kind: 'card', subtitleKey: 'catCard', amount: -249, accountId: 'acc-usd', currency: 'USD' },
  { ago: 36, title: 'Poplatek za vedení účtu', kind: 'fee', subtitleKey: 'catFee', amount: -5, accountId: 'acc-usd', currency: 'USD' },

  // ---- eurový účet
  { ago: 15, title: 'Ubytování Jižní vítr', kind: 'card', subtitleKey: 'catCard', amount: -320, accountId: 'acc-eur', currency: 'EUR' },
  { ago: 16, title: 'Restaurace U Přístavu', kind: 'restaurant', subtitleKey: 'catRestaurant', amount: -78.4, accountId: 'acc-eur', currency: 'EUR' },
  { ago: 52, title: 'Vratka za ubytování', kind: 'incoming', subtitleKey: 'catRefund', amount: 145, accountId: 'acc-eur', currency: 'EUR' },

  // ---- peněženka
  { ago: 2, title: 'VES → XSGD', kind: 'exchange', subtitleKey: 'exchangeDone', amount: -2000, accountId: 'wallet', currency: 'VES' },
  { ago: 13, title: 'XSGD', kind: 'crypto', subtitleKey: 'bought', amount: -5000, accountId: 'wallet', currency: 'VES' },
  { ago: 20, title: 'Safe money', kind: 'vault', subtitleKey: 'moved', amount: -8000, accountId: 'wallet', currency: 'VES' },
  { ago: 44, title: 'Safe money', kind: 'vault', subtitleKey: 'moved', amount: -4000, accountId: 'wallet', currency: 'VES' },
]

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function buildHistory(): Tx[] {
  return ROWS.map((r, i) => ({
    id: `seed-${i}`,
    accountId: r.accountId ?? 'acc-czk',
    title: r.title,
    subtitleKey: r.subtitleKey,
    kind: r.kind,
    amount: r.amount,
    currency: r.currency ?? 'CZK',
    date: isoDaysAgo(r.ago),
    seq: ROWS.length - i,
    note: r.note,
  })).sort((a, b) => (a.date === b.date ? (b.seq ?? 0) - (a.seq ?? 0) : a.date < b.date ? 1 : -1))
}

export const seedTransactions: Tx[] = buildHistory()

/* ------------------------------------------------------------ notifikace */

export const seedNotifications: AppNotification[] = [
  {
    id: 'n1',
    title: 'Mzda připsána',
    body: 'Na běžný účet byla připsána částka 48 500,00 CZK.',
    date: isoDaysAgo(10),
    read: false,
  },
  {
    id: 'n2',
    title: 'Ověření dokončeno',
    body: 'Simulované ověření identity proběhlo úspěšně.',
    date: isoDaysAgo(11),
    read: false,
  },
  {
    id: 'n3',
    title: 'Karta zamknuta',
    body: 'Karta ****2244 byla zamknuta na vaši žádost.',
    date: isoDaysAgo(14),
    read: true,
  },
  {
    id: 'n4',
    title: 'Trvalá platba',
    body: 'Nájem 14 500,00 CZK byl odeslán podle šablony.',
    date: isoDaysAgo(9),
    read: true,
  },
]

export const seedWallet = {
  ves: 30456,
  xsgd: 1454,
  /** Úschova je vedená po měnách — klient si odkládá z toho účtu, který zvolí. */
  // Safe Money je zásadně v XSGD — proto jediná položka, ne trezor po měnách.
  vaults: { XSGD: 850 } as Partial<Record<Currency, number>>,
}

export const WALLET_ADDRESS = '0x7F4a  9C21  8Be3  D05f  1A77  6C90'
