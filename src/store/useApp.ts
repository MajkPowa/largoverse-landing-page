import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '../i18n'
import {
  seedAccounts,
  seedCards,
  seedContacts,
  seedNotifications,
  seedPayees,
  seedTransactions,
  seedWallet,
  HOLDER,
} from '../domain/seed'
import { tariffFor } from '../domain/pricing'
import {
  convert,
  exchangeRate,
  TRANSFER_FEE_CZK,
  type Account,
  type AppNotification,
  type Card,
  type CardState,
  type Contact,
  type Currency,
  type Payee,
  type Tx,
} from '../domain/types'

export type KycStatus = 'none' | 'pending' | 'approved'

export interface KycState {
  docType: 'idCard' | 'passport' | 'driverLicense'
  front: boolean
  back: boolean
  selfie: boolean
  utilityBill: boolean
  bankStatement: boolean
  status: KycStatus
}

interface Wallet {
  ves: number
  xsgd: number
  /** Úschova po měnách — každá měna má vlastní odloženou částku. */
  vaults: Partial<Record<Currency, number>>
}

interface AppState {
  /* přístup a session */
  unlocked: boolean
  authed: boolean
  languageChosen: boolean
  onboarded: boolean
  lang: Lang
  faceId: boolean
  holder: string

  /* KYC */
  kyc: KycState

  /* data */
  accounts: Account[]
  cards: Card[]
  transactions: Tx[]
  notifications: AppNotification[]
  contacts: Contact[]
  payees: Payee[]
  wallet: Wallet

  /* UI */
  toast: string | null
  /** Měna, ve které se zobrazují částky. null = původní měna dané položky. */
  displayCurrency: Currency | null
  /** Pořadí řádků v přehledu aktiv — uživatel si je může přeskládat. */
  assetOrder: string[]

  /* akce – session */
  unlock: (code: string) => boolean
  setLang: (lang: Lang) => void
  confirmLanguage: () => void
  finishOnboarding: () => void
  signIn: () => void
  signOut: () => void
  setFaceId: (on: boolean) => void

  /* akce – KYC */
  setDocType: (t: KycState['docType']) => void
  setKycFlag: (key: 'front' | 'back' | 'selfie' | 'utilityBill' | 'bankStatement', v: boolean) => void
  submitKyc: () => void
  approveKyc: () => void

  /* akce – peníze */
  pay: (input: { accountId: string; title: string; amount: number; note?: string }) => boolean
  transferOwn: (input: { fromId: string; toId: string; amount: number }) => boolean
  exchangeVesXsgd: (amount: number, direction: 'vesToXsgd' | 'xsgdToVes') => boolean
  /** Směna mezi libovolnými dvěma drženými měnami. */
  exchangeAny: (from: Currency, to: Currency, amount: number) => boolean
  balanceOf: (currency: Currency) => number
  buyCrypto: (vesAmount: number) => boolean
  /**
   * Přesun mezi volným zůstatkem a úschovou.
   * `source` je měna, ve které klient částku zadává — může se lišit od měny
   * trezoru, pak se po cestě směňuje.
   */
  vaultMove: (
    currency: Currency,
    amount: number,
    direction: 'in' | 'out',
    source?: Currency,
  ) => boolean

  /* akce – karty */
  setCardState: (cardId: string, state: CardState) => void
  setCardPin: (cardId: string, pin: string) => void
  setCardLimit: (cardId: string, key: 'merchant' | 'cash' | 'internet', value: number) => void
  cancelCard: (cardId: string) => void
  generateCard: (accountId: string) => void

  /* akce – ostatní */
  markNotificationsRead: () => void
  showToast: (msg: string | null) => void
  setDisplayCurrency: (c: Currency | null) => void
  reorderAssets: (ids: string[]) => void
  resetDemo: () => void

  /* režim prezentace – ruční spouštěče simulovaných událostí */
  simulateIncoming: () => void
  simulateCardCharge: () => void
  simulateCryptoIn: () => void
}

/**
 * Přístupové kódy pro uzavřenou betu (lokální vývoj a nešifrované buildy).
 * Nastavují se přes VITE_ACCESS_CODES (oddělené čárkou) při buildu.
 *
 * POZOR: tahle brána je jen v prohlížeči — kód je součástí staženého balíčku
 * a nechrání před nikým, kdo se do balíčku podívá. Skutečnou ochranu dělá
 * šifrovaný build (`npm run build:secure`), kde je celá aplikace zašifrovaná
 * a bez hesla se nedá ani načíst. Viz README.
 */
/**
 * Kód se porovnává znormalizovaný — velikost písmen, pomlčky ani mezery
 * nerozhodují. Stejné pravidlo platí v zaváděcí stránce šifrovaného buildu
 * (scripts/build-secure.mjs), aby jeden kód fungoval všude stejně.
 */
const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')

const ACCESS_CODES = (import.meta.env.VITE_ACCESS_CODES ?? 'DEMO')
  .split(',')
  .map(normalizeCode)
  .filter(Boolean)

/**
 * U šifrovaného buildu už heslo padlo na dveřích (v zaváděcí stránce),
 * takže vnitřní brána se vypíná — investor nezadává kód dvakrát.
 */
const GATE_DISABLED = import.meta.env.VITE_GATE === 'off'

const initialData = () => ({
  accounts: structuredClone(seedAccounts),
  cards: structuredClone(seedCards),
  transactions: structuredClone(seedTransactions),
  notifications: structuredClone(seedNotifications),
  contacts: structuredClone(seedContacts),
  payees: structuredClone(seedPayees),
  wallet: { ...seedWallet },
})

const today = () => new Date().toISOString().slice(0, 10)
const uid = () => `tx-${Math.random().toString(36).slice(2, 10)}`

/**
 * Záznam do historie. `accountId: 'wallet'` znamená pohyb v peněžence
 * (směna, nákup crypto, trezor) — v přehledu se ukáže, ve výpisu účtu ne.
 */
function tx(input: Omit<Tx, 'id' | 'date'>): Tx {
  return { ...input, id: uid(), date: today() }
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      unlocked: GATE_DISABLED,
      authed: false,
      languageChosen: false,
      onboarded: false,
      lang: 'cs',
      faceId: false,
      holder: HOLDER,
      kyc: {
        docType: 'idCard',
        front: false,
        back: false,
        selfie: false,
        utilityBill: false,
        bankStatement: false,
        status: 'none',
      },
      ...initialData(),
      toast: null,
      displayCurrency: null,
      assetOrder: ['acc-czk', 'acc-usd', 'acc-eur', 'wallet-ves', 'wallet-xsgd', 'vault-XSGD'],

      unlock: (code) => {
        const ok = ACCESS_CODES.includes(normalizeCode(code))
        if (ok) set({ unlocked: true })
        return ok
      },
      setLang: (lang) => set({ lang }),
      confirmLanguage: () => set({ languageChosen: true }),
      finishOnboarding: () => set({ onboarded: true }),
      signIn: () => set({ authed: true }),
      // Odhlášení nesmí shodit jazyk, onboarding ani KYC — jinak by se ověřenému
      // klientovi po odhlášení nabídla registrace místo přihlášení.
      signOut: () => set({ authed: false }),
      setFaceId: (on) => set({ faceId: on }),

      setDocType: (t) => set((s) => ({ kyc: { ...s.kyc, docType: t } })),
      setKycFlag: (key, v) => set((s) => ({ kyc: { ...s.kyc, [key]: v } })),
      submitKyc: () => set((s) => ({ kyc: { ...s.kyc, status: 'pending' } })),
      approveKyc: () => set((s) => ({ kyc: { ...s.kyc, status: 'approved' } })),

      pay: ({ accountId, title, amount, note }) => {
        const account = get().accounts.find((a) => a.id === accountId)
        if (!account || amount <= 0 || account.balance < amount) return false
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === accountId ? { ...a, balance: round(a.balance - amount) } : a,
          ),
          transactions: [
            tx({
              accountId,
              title,
              subtitleKey: 'paymentSent',
              kind: 'transfer',
              amount: -round(amount),
              currency: account.currency,
              note: note?.trim() || undefined,
            }),
            ...s.transactions,
          ],
        }))
        return true
      },

      transferOwn: ({ fromId, toId, amount }) => {
        const { accounts } = get()
        const from = accounts.find((a) => a.id === fromId)
        const to = accounts.find((a) => a.id === toId)
        if (!from || !to || amount <= 0) return false

        const feeInFrom = convert(TRANSFER_FEE_CZK, 'CZK', from.currency)
        const credited = convert(amount, from.currency, to.currency)
        const debited = amount + feeInFrom
        if (from.balance < debited) return false

        set((s) => ({
          accounts: s.accounts.map((a) => {
            if (a.id === fromId) return { ...a, balance: round(a.balance - debited) }
            if (a.id === toId) return { ...a, balance: round(a.balance + credited) }
            return a
          }),
          transactions: [
            tx({
              accountId: toId,
              title: `${from.currency} → ${to.currency}`,
              subtitleKey: 'paymentSent',
              kind: 'incoming',
              amount: round(credited, to.currency === 'VES' ? 0 : 2),
              currency: to.currency,
            }),
            tx({
              accountId: fromId,
              title: `${from.currency} → ${to.currency}`,
              subtitleKey: 'paymentSent',
              kind: 'transfer',
              amount: -round(debited),
              currency: from.currency,
            }),
            ...s.transactions,
          ],
        }))
        return true
      },

      exchangeVesXsgd: (amount, direction) => {
        const { wallet } = get()
        if (amount <= 0) return false

        if (direction === 'vesToXsgd') {
          if (wallet.ves < amount) return false
          const gained = round(amount * exchangeRate('vesToXsgd'), 4)
          set((s) => ({
            wallet: { ...s.wallet, ves: round(s.wallet.ves - amount, 0), xsgd: round(s.wallet.xsgd + gained, 4) },
            transactions: [
              tx({
                accountId: 'wallet',
                title: 'VES → XSGD',
                subtitleKey: 'exchangeDone',
                kind: 'exchange',
                amount: -round(amount, 0),
                currency: 'VES',
              }),
              ...s.transactions,
            ],
          }))
        } else {
          if (wallet.xsgd < amount) return false
          const gained = round(amount * exchangeRate('xsgdToVes'), 0)
          set((s) => ({
            wallet: { ...s.wallet, xsgd: round(s.wallet.xsgd - amount, 4), ves: round(s.wallet.ves + gained, 0) },
            transactions: [
              tx({
                accountId: 'wallet',
                title: 'XSGD → VES',
                subtitleKey: 'exchangeDone',
                kind: 'exchange',
                amount: -round(amount, 4),
                currency: 'XSGD',
              }),
              ...s.transactions,
            ],
          }))
        }
        return true
      },

      balanceOf: (currency) => {
        const s = get()
        if (currency === 'VES') return s.wallet.ves
        if (currency === 'XSGD') return s.wallet.xsgd
        return s.accounts.find((a) => a.currency === currency)?.balance ?? 0
      },

      exchangeAny: (from, to, amount) => {
        if (from === to || amount <= 0) return false
        const s = get()

        /*
         * Kde je daná měna vedená. null = nikde — pak se směna NESMÍ provést,
         * jinak by se zdrojová částka odepsala a cílová se ztratila v prázdnu.
         */
        const locate = (c: Currency): 'ves' | 'xsgd' | string | null => {
          if (c === 'VES') return 'ves'
          if (c === 'XSGD') return 'xsgd'
          return s.accounts.find((a) => a.currency === c)?.id ?? null
        }

        const src = locate(from)
        const dst = locate(to)
        if (!src || !dst) return false

        // Zaokrouhlit hned na začátku: 0,4 VES by se jinak odečetlo jako nula,
        // ale cílová měna by se připsala.
        const decOf = (c: Currency) => (c === 'VES' ? 0 : c === 'XSGD' ? 4 : 2)
        amount = round(amount, decOf(from))
        if (amount <= 0) return false

        /*
         * Sazba se řídí tím, jestli je některá strana v hyperinflaci. Poplatek
         * se strhává navíc ke směňované částce, takže musí být pokrytý
         * zůstatkem — jinak by se účet dostal do mínusu.
         */
        const tariff = tariffFor(from, to)
        const fee = tariff.feeCzk > 0 ? round(convert(tariff.feeCzk, 'CZK', from), decOf(from)) : 0
        if (get().balanceOf(from) < amount + fee) return false

        // Spread se odečítá z převedené částky — proto je směna tam a zpět ztrátová.
        const credited = convert(amount, from, to) * (1 - tariff.spread)
        const dec = (c: Currency) => (c === 'VES' ? 0 : c === 'XSGD' ? 4 : 2)

        set((state) => {
          let wallet = { ...state.wallet }
          let accounts = [...state.accounts]
          const add = (c: Currency, delta: number) => {
            if (c === 'VES') wallet = { ...wallet, ves: round(wallet.ves + delta, 0) }
            else if (c === 'XSGD') wallet = { ...wallet, xsgd: round(wallet.xsgd + delta, 4) }
            else
              accounts = accounts.map((acc) =>
                acc.currency === c ? { ...acc, balance: round(acc.balance + delta) } : acc,
              )
          }
          add(from, -(amount + fee))
          add(to, credited)

          // Pohyb na účtu patří do výpisu toho účtu, ne do peněženky.
          const rowFor = (holder: string, currency: Currency, value: number) =>
            tx({
              accountId: holder === 'ves' || holder === 'xsgd' ? 'wallet' : holder,
              title: `${from} → ${to}`,
              subtitleKey: 'exchangeDone',
              kind: 'exchange',
              amount: round(value, dec(currency)),
              currency,
            })

          // Poplatek je vlastní řádek — ve výpisu musí být vidět, za co se strhl.
          const feeRow = tx({
            accountId: src === 'ves' || src === 'xsgd' ? 'wallet' : src,
            title: `${from} → ${to}`,
            subtitleKey: 'catFee',
            kind: 'fee',
            amount: -fee,
            currency: from,
          })

          return {
            wallet,
            accounts,
            transactions: [
              rowFor(dst, to, credited),
              rowFor(src, from, -amount),
              ...(fee > 0 ? [feeRow] : []),
              ...state.transactions,
            ],
          }
        })
        return true
      },

      buyCrypto: (vesAmount) => {
        const { wallet } = get()
        if (vesAmount <= 0 || wallet.ves < vesAmount) return false
        const gained = round(vesAmount * exchangeRate('vesToXsgd'), 4)
        set((s) => ({
          wallet: {
            ...s.wallet,
            ves: round(s.wallet.ves - vesAmount, 0),
            xsgd: round(s.wallet.xsgd + gained, 4),
          },
          transactions: [
            tx({
              accountId: 'wallet',
              title: 'XSGD',
              subtitleKey: 'bought',
              kind: 'crypto',
              amount: -round(vesAmount, 0),
              currency: 'VES',
            }),
            ...s.transactions,
          ],
        }))
        return true
      },

      vaultMove: (currency, amount, direction, source = currency) => {
        if (amount <= 0) return false
        const s = get()
        const dec = (c: Currency) => (c === 'VES' ? 0 : c === 'XSGD' ? 4 : 2)

        // Kde je volný zůstatek vedený. null = nikde — pak se hnout nesmí,
        // stejný důvod jako u směny.
        const holder =
          source === 'VES'
            ? 'ves'
            : source === 'XSGD'
              ? 'xsgd'
              : (s.accounts.find((a) => a.currency === source)?.id ?? null)
        if (!holder) return false

        amount = round(amount, dec(source))
        if (amount <= 0) return false

        /*
         * Vklad z jiné měny je zároveň směna, takže musí nést stejnou sazbu
         * jako obrazovka směny. Jinak by se dal spread obejít tím, že peníze
         * projdou přes trezor.
         */
        const cross = source !== currency
        const spread = cross ? tariffFor(source, currency).spread : 0

        const inVault = s.wallet.vaults[currency] ?? 0
        const free = get().balanceOf(source)

        // Kolik se pohne v měně trezoru. Při výběru se částka navyšuje o
        // spread, aby klient dostal na účet přesně to, co si zadal.
        const vaultDelta =
          direction === 'in'
            ? round(convert(amount, source, currency) * (1 - spread), dec(currency))
            : round(convert(amount, source, currency) / (1 - spread), dec(currency))

        if (vaultDelta <= 0) return false
        if (direction === 'in' ? free < amount : inVault < vaultDelta) return false

        // Pohyb na volném zůstatku; v trezoru je opačný.
        const freeDelta = direction === 'in' ? -amount : amount

        set((state) => {
          let wallet = { ...state.wallet }
          let accounts = [...state.accounts]

          if (source === 'VES') wallet.ves = round(wallet.ves + freeDelta, 0)
          else if (source === 'XSGD') wallet.xsgd = round(wallet.xsgd + freeDelta, 4)
          else
            accounts = accounts.map((a) =>
              a.currency === source ? { ...a, balance: round(a.balance + freeDelta) } : a,
            )

          wallet.vaults = {
            ...wallet.vaults,
            [currency]: round(
              (wallet.vaults[currency] ?? 0) + (direction === 'in' ? vaultDelta : -vaultDelta),
              dec(currency),
            ),
          }

          return {
            wallet,
            accounts,
            transactions: [
              tx({
                // Pohyb na účtu patří do výpisu toho účtu, ne do peněženky.
                accountId: holder === 'ves' || holder === 'xsgd' ? 'wallet' : holder,
                title: cross ? `${source} → ${currency}` : 'Safe Money',
                subtitleKey: 'moved',
                kind: 'vault',
                amount: freeDelta,
                currency: source,
              }),
              ...state.transactions,
            ],
          }
        })
        return true
      },

      setCardState: (cardId, state) =>
        set((s) => ({ cards: s.cards.map((c) => (c.id === cardId ? { ...c, state } : c)) })),
      setCardPin: (cardId, pin) =>
        set((s) => ({ cards: s.cards.map((c) => (c.id === cardId ? { ...c, pin } : c)) })),
      setCardLimit: (cardId, key, value) =>
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId ? { ...c, limits: { ...c.limits, [key]: value } } : c,
          ),
        })),
      cancelCard: (cardId) =>
        set((s) => ({
          cards: s.cards.map((c) => (c.id === cardId ? { ...c, cancelled: true, state: 'locked' } : c)),
        })),
      generateCard: (accountId) =>
        set((s) => {
          const account = s.accounts.find((a) => a.id === accountId)
          if (!account) return s
          const last4 = String(Math.floor(1000 + Math.random() * 9000))
          // Limity odpovídají měně účtu — 50 000 CZK dává smysl, 50 000 USD ne.
          const base = account.currency === 'CZK' ? 1 : 1 / convert(1, account.currency, 'CZK')
          const card: Card = {
            id: `card-${last4}`,
            accountId,
            currency: account.currency,
            brand: 'VISA',
            number: `4${randomDigits(3)} ${randomDigits(4)} ${randomDigits(4)} ${last4}`,
            last4,
            expiry: '02/30',
            holder: 'Ondrej Veverka',
            cvv: randomDigits(3),
            pin: randomDigits(4),
            state: 'active',
            limits: {
              merchant: round(50000 * base, 0),
              cash: round(20000 * base, 0),
              internet: round(20000 * base, 0),
            },
            cancelled: false,
          }
          return { cards: [...s.cards, card] }
        }),

      markNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      showToast: (msg) => set({ toast: msg }),
      setDisplayCurrency: (c) => set({ displayCurrency: c }),

      reorderAssets: (ids) => set({ assetOrder: ids }),

      /* ---------------- režim prezentace ----------------
         Ruční spouštěče. Nikdy se nespouštějí samy — prezentující musí
         vědomě klepnout, aby nikdy netvrdil, že se něco stalo samo. */

      simulateIncoming: () =>
        set((s) => {
          const contact = s.contacts[1] ?? s.contacts[0]
          const amount = 2450
          return {
            accounts: s.accounts.map((a) =>
              a.id === 'acc-czk' ? { ...a, balance: round(a.balance + amount) } : a,
            ),
            transactions: [
              tx({
                accountId: 'acc-czk',
                title: contact?.name ?? 'P2P',
                subtitleKey: 'catP2P',
                kind: 'incoming',
                amount,
                currency: 'CZK',
              }),
              ...s.transactions,
            ],
            notifications: [
              {
                id: uid(),
                title: 'Příchozí platba',
                body: `Na běžný účet bylo připsáno 2 450,00 CZK.`,
                date: today(),
                read: false,
              },
              ...s.notifications,
            ],
          }
        }),

      simulateCardCharge: () =>
        set((s) => {
          const card = s.cards.find((c) => !c.cancelled && c.state === 'active' && c.currency === 'CZK')
          const account = s.accounts.find((a) => a.id === card?.accountId)
          if (!card || !account) return s
          const amount = 1890
          if (account.balance < amount) return s
          return {
            accounts: s.accounts.map((a) =>
              a.id === account.id ? { ...a, balance: round(a.balance - amount) } : a,
            ),
            transactions: [
              tx({
                accountId: account.id,
                title: 'Elektro Podkova',
                subtitleKey: 'catCard',
                kind: 'card',
                amount: -amount,
                currency: account.currency,
              }),
              ...s.transactions,
            ],
          }
        }),

      simulateCryptoIn: () =>
        set((s) => {
          const amount = 250
          return {
            wallet: { ...s.wallet, xsgd: round(s.wallet.xsgd + amount, 4) },
            transactions: [
              tx({
                accountId: 'wallet',
                title: 'XSGD',
                subtitleKey: 'catRefund',
                kind: 'crypto',
                amount,
                currency: 'XSGD',
              }),
              ...s.transactions,
            ],
          }
        }),

      resetDemo: () =>
        set({
          authed: false,
          languageChosen: false,
          onboarded: false,
          faceId: false,
          kyc: {
            docType: 'idCard',
            front: false,
            back: false,
            selfie: false,
            utilityBill: false,
            bankStatement: false,
            status: 'none',
          },
          ...initialData(),
          toast: null,
          // Reset musí vrátit i to, co si uživatel nastavil v UI — jinak další
          // prezentace začne v cizí měně a s přeházeným pořadím aktiv.
          displayCurrency: null,
          assetOrder: ['acc-czk', 'acc-usd', 'acc-eur', 'wallet-ves', 'wallet-xsgd', 'vault-XSGD'],
        }),
    }),
    {
      // Safe Money je nově vždycky v XSGD, takže staré uložené trezory po měnách
      // (VES, CZK) už nedávají smysl — nový klíč, ať se stavy nesejdou.
      name: 'largoverse-beta-4',
      version: 4,
      // `unlocked` se záměrně neukládá — po zavření okna se brána zavře znovu.
      partialize: ({ toast: _toast, unlocked: _unlocked, ...rest }) => rest,
    },
  ),
)

function round(n: number, decimals = 2): number {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

function randomDigits(n: number): string {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('')
}

/* ---------- odvozené hodnoty ---------- */

export function accountByCurrency(accounts: Account[], currency: Currency) {
  return accounts.find((a) => a.currency === currency)
}
