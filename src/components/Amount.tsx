import { useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { convert, DISPLAY_CURRENCIES, type Account, type Currency } from '../domain/types'
import { useApp } from '../store/useApp'
import { useT } from '../lib/useT'
import { amountOnly, money } from '../lib/format'
import { currencyGroups, currencyName } from '../lib/currency'
import { Sheet } from './ui'

/**
 * Seznam měn ve výběru — po skupinách, uvnitř seřazený podle názvu měny.
 * Sdílený, aby výběr vypadal všude stejně: v přepínači zobrazení i tam,
 * kde měna vstupuje do operace.
 */
function CurrencyOptions({
  options,
  selected,
  onPick,
  disabledOption,
  sub,
}: {
  options: Currency[]
  selected: Currency
  onPick: (c: Currency) => void
  disabledOption?: Currency
  /** Druhý řádek pod názvem — třeba částka přepočtená do dané měny. */
  sub?: (c: Currency) => ReactNode
}) {
  const { t, lang } = useT()

  return (
    <>
      {currencyGroups(options, t, lang).map((group) => (
        <div key={group.key} style={{ marginBottom: 6 }}>
          <h3
            className="muted"
            style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '10px 2px 6px' }}
          >
            {group.label}
          </h3>
          <div className="stack">
            {group.items.map((c) => {
              /*
               * Zvažované tokeny se ukazují průhledně a nejdou vybrat. Má být
               * vidět, že o nich víme, a zároveň že nejsou součástí nabídky —
               * každý další token znamená vlastní AML dohled a vlastní
               * posouzení podle MiCA.
               */
              const blocked = c === disabledOption || group.considered === true
              return (
                <button
                  key={c}
                  className={`option option--muted${selected === c ? ' option--selected' : ''}`}
                  disabled={blocked}
                  style={blocked ? { opacity: group.considered ? 0.35 : 0.4 } : undefined}
                  onClick={() => onPick(c)}
                >
                  <span className="option__label">
                    {c} · {currencyName(c, t)}
                    {group.considered && (
                      <span className="listrow__sub" style={{ display: 'block' }}>
                        {t('consideredNote')}
                      </span>
                    )}
                    {sub && !group.considered && (
                      <span className="listrow__sub" style={{ display: 'block' }}>
                        {sub(c)}
                      </span>
                    )}
                  </span>
                  {selected === c && <Check size={20} className="option__check" strokeWidth={2} />}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}

/**
 * Samostatný výběr měny — pilulka s kódem a šipkou.
 * Používá se tam, kde měna není jen zobrazení, ale vstup operace (směna, nákup).
 */
export function CurrencySelect({
  value,
  options,
  onChange,
  disabledOption,
  light = false,
}: {
  value: Currency
  options: Currency[]
  onChange: (c: Currency) => void
  /** Měna, kterou nelze zvolit — typicky protistrana směny. */
  disabledOption?: Currency
  /** Na tmavém podkladu (karta trezoru). */
  light?: boolean
}) {
  const { t } = useT()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          flex: 'none',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.04em',
          color: light ? '#fff' : 'var(--primary)',
          background: light ? 'rgba(255,255,255,.18)' : 'var(--primary-soft)',
          borderRadius: 'var(--r-pill)',
          padding: '6px 12px',
          minWidth: 84,
          justifyContent: 'center',
        }}
        aria-label={t('chooseCurrency')}
      >
        {value}
        <ChevronDown size={15} strokeWidth={2.4} />
      </button>

      {open && (
        <Sheet title={t('chooseCurrency')} onClose={() => setOpen(false)} tall>
          <CurrencyOptions
            options={options}
            selected={value}
            disabledOption={disabledOption}
            onPick={(c) => {
              onChange(c)
              setOpen(false)
            }}
          />
          <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
            {t('rateDisclaimer')}
          </p>
        </Sheet>
      )}
    </>
  )
}

/**
 * Výběr účtu, ze kterého operace poběží — a tím i měny.
 *
 * Původně to byla řádka chipů, jenže ta se při třech účtech nevešla na šířku
 * telefonu a poslední účet byl uříznutý. Tohle je jedno tlačítko přes celou
 * šířku; seznam se otevře odspodu, takže se vejde libovolný počet účtů.
 */
export function AccountSelect({
  accounts,
  value,
  onChange,
  label,
}: {
  accounts: Account[]
  value: string
  onChange: (id: string) => void
  label: string
}) {
  const { t, lang } = useT()
  const [open, setOpen] = useState(false)
  const current = accounts.find((a) => a.id === value) ?? accounts[0]
  if (!current) return null

  return (
    <>
      <button
        className="field field--muted"
        style={{
          width: '100%',
          textAlign: 'left',
          // .field se skládá do sloupce; tady chceme pilulku vedle popisu.
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
        onClick={() => setOpen(true)}
      >
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="field__label">{label}</span>
          <span style={{ display: 'block' }}>{t(current.kind)}</span>
          <span className="listrow__sub" style={{ display: 'block' }}>
            {money(current.balance, current.currency, lang)}
          </span>
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            flex: 'none',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: 'var(--primary)',
            background: 'var(--primary-soft)',
            borderRadius: 'var(--r-pill)',
            padding: '6px 12px',
          }}
        >
          {current.currency}
          <ChevronDown size={15} strokeWidth={2.4} />
        </span>
      </button>

      {open && (
        <Sheet title={label} onClose={() => setOpen(false)} tall>
          <div className="stack">
            {accounts.map((a) => (
              <button
                key={a.id}
                className={`option option--muted${a.id === value ? ' option--selected' : ''}`}
                onClick={() => {
                  onChange(a.id)
                  setOpen(false)
                }}
              >
                <span className="option__label">
                  {a.currency} · {currencyName(a.currency, t)}
                  <span className="listrow__sub" style={{ display: 'block' }}>
                    {t(a.kind)} · {money(a.balance, a.currency, lang)}
                  </span>
                </span>
                {a.id === value && <Check size={20} className="option__check" strokeWidth={2} />}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </>
  )
}

/**
 * Částka s přepínačem měny.
 *
 * Drženou hodnotu to nemění — jen ji přepočítá a ukáže v jiné měně.
 * Volba je globální, takže přepnutí na jednom místě se projeví všude.
 */
export function Amount({
  value,
  currency,
  size = 'md',
  light = false,
  options = DISPLAY_CURRENCIES,
}: {
  /** Částka v původní měně držby. */
  value: number
  /** Měna, ve které je částka vedená. */
  currency: Currency
  size?: 'sm' | 'md' | 'lg'
  /** Na tmavém podkladu (karta trezoru, peněženka). */
  light?: boolean
  /** Které měny se nabídnou — u crypto zůstatku jen stablecoiny. */
  options?: Currency[]
}) {
  const { t, lang } = useT()
  const display = useApp((s) => s.displayCurrency)
  const setDisplay = useApp((s) => s.setDisplayCurrency)
  const [open, setOpen] = useState(false)

  /*
   * Globální volba měny platí jen tehdy, když ji tahle částka vůbec nabízí.
   * Jinak by se korunový zůstatek po přepnutí crypto dlaždice ukázal v USDT
   * a v seznamu by nebylo nic zatržené.
   */
  const shown: Currency = display && options.includes(display) ? display : currency
  const converted = convert(value, currency, shown)

  const ink = light ? '#fff' : 'var(--primary)'
  const fontSize = size === 'lg' ? 30 : size === 'md' ? 21 : 16

  /*
   * Číslo a měna jsou na dvou řádcích. Kdyby byly vedle sebe, delší hodnota
   * po přepnutí měny se ořízne — a částka, ze které není vidět celé číslo,
   * je v bankovní aplikaci k ničemu.
   */
  return (
    <>
      <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
        <span
          style={{
            fontSize,
            fontWeight: 600,
            color: ink,
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
          }}
        >
          {amountOnly(converted, shown, lang)}
        </span>
        <button
          onClick={() => setOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            justifySelf: 'start',
            fontSize: size === 'lg' ? 14 : 12,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: ink,
            opacity: light ? 0.9 : 0.8,
            background: light ? 'rgba(255,255,255,.16)' : 'var(--primary-soft)',
            borderRadius: 'var(--r-pill)',
            padding: size === 'lg' ? '3px 9px' : '2px 8px',
          }}
          aria-label={t('chooseCurrency')}
        >
          {shown}
          <ChevronDown size={size === 'lg' ? 15 : 13} strokeWidth={2.4} />
        </button>
      </div>

      {open && (
        <Sheet title={t('chooseCurrency')} onClose={() => setOpen(false)} tall>
          {/* Zatržená je vždycky ta měna, ve které se částka právě ukazuje —
              ať už ji uživatel zvolil, nebo je to výchozí měna položky. */}
          <CurrencyOptions
            options={options}
            selected={shown}
            sub={(c) => money(convert(value, currency, c), c, lang)}
            onPick={(c) => {
              setDisplay(c)
              setOpen(false)
            }}
          />

          <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
            {t('rateDisclaimer')}
          </p>
        </Sheet>
      )}
    </>
  )
}
