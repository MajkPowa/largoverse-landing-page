import type { ReactNode } from 'react'
import { Check, ChevronLeft, ChevronRight, Delete, X } from 'lucide-react'
import { useT } from '../lib/useT'

/* ---------------------------------------------------------------- status bar */

export function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`statusbar${dark ? ' statusbar--dark' : ''}`}
      style={dark ? { background: '#1b2427' } : undefined}
    >
      <span>9:41</span>
      <span className="statusbar__icons">
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </span>
    </div>
  )
}

function SignalIcon() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden>
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
      <rect x="10" y="3" width="3" height="9" rx="1" />
      <rect x="15" y="0" width="3" height="12" rx="1" />
    </svg>
  )
}

function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
      <path d="M8 11.2 5.9 8.8a3.2 3.2 0 0 1 4.2 0L8 11.2Z" />
      <path
        d="M3.6 6.2a6.6 6.6 0 0 1 8.8 0l-1.3 1.5a4.6 4.6 0 0 0-6.2 0L3.6 6.2Z"
        opacity=".95"
      />
      <path d="M1.2 3.4a10 10 0 0 1 13.6 0l-1.3 1.5a8 8 0 0 0-11 0L1.2 3.4Z" opacity=".95" />
    </svg>
  )
}

function BatteryIcon() {
  return (
    <svg width="26" height="13" viewBox="0 0 26 13" aria-hidden>
      <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4" />
      <rect x="2" y="2" width="19" height="9" rx="2.2" fill="currentColor" />
      <path d="M24 4.5v4a2.2 2.2 0 0 0 0-4Z" fill="currentColor" opacity=".5" />
    </svg>
  )
}

/* ------------------------------------------------------------------- top bar */

export function TopBar({
  title,
  onBack,
  center = false,
  right,
}: {
  title?: string
  onBack?: () => void
  center?: boolean
  right?: ReactNode
}) {
  return (
    <div className={`topbar${center ? ' topbar--center' : ''}`}>
      {onBack && (
        <button className="topbar__back" onClick={onBack} aria-label="Zpět">
          <ChevronLeft size={24} strokeWidth={1.8} />
        </button>
      )}
      {title && <span className="topbar__title">{title}</span>}
      <span className="spacer" />
      {right}
    </div>
  )
}

/* ------------------------------------------------------------------ tlačítka */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'social'

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  icon,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  disabled?: boolean
  icon?: ReactNode
}) {
  return (
    <button className={`btn btn--${variant}`} onClick={onClick} disabled={disabled}>
      {icon}
      {children}
    </button>
  )
}

/* ---------------------------------------------------------------------- pole */

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  muted = false,
  icon,
  readOnly,
  onClick,
}: {
  label?: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: 'text' | 'password' | 'email' | 'tel' | 'number'
  muted?: boolean
  icon?: ReactNode
  readOnly?: boolean
  onClick?: () => void
}) {
  const classes = ['field']
  if (muted) classes.push('field--muted')
  if (icon) classes.push('field--icon')
  return (
    <label className={classes.join(' ')} onClick={onClick}>
      {icon && <span className="field__icon">{icon}</span>}
      <span style={{ flex: 1, minWidth: 0 }}>
        {label && value && <span className="field__label">{label}</span>}
        <input
          type={type}
          value={value}
          placeholder={placeholder ?? label}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </span>
    </label>
  )
}

/* ---------------------------------------------------------------- list řádek */

export function ListRow({
  icon,
  title,
  subtitle,
  right,
  rightSub,
  onClick,
  squareIcon,
}: {
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  rightSub?: ReactNode
  onClick?: () => void
  squareIcon?: boolean
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className="listrow" onClick={onClick}>
      {icon && (
        <span className={`listrow__icon${squareIcon ? ' listrow__icon--square' : ''}`}>{icon}</span>
      )}
      <span className="listrow__main">
        <span className="listrow__title">{title}</span>
        {subtitle && <span className="listrow__sub" style={{ display: 'block' }}>{subtitle}</span>}
      </span>
      {(right || rightSub) && (
        <span className="listrow__right">
          {right && <span className="listrow__amount" style={{ display: 'block' }}>{right}</span>}
          {rightSub && <span className="listrow__sub">{rightSub}</span>}
        </span>
      )}
    </Tag>
  )
}

export function MenuItem({
  icon,
  label,
  sub,
  onClick,
}: {
  icon?: ReactNode
  label: string
  sub?: string
  onClick?: () => void
}) {
  return (
    <button className="menu-list__item" onClick={onClick}>
      {icon}
      <span className="menu-list__label">
        {label}
        {sub && <span className="menu-list__sub" style={{ display: 'block' }}>{sub}</span>}
      </span>
      <ChevronRight size={20} strokeWidth={1.6} className="muted" />
    </button>
  )
}

/* ------------------------------------------------------------------- volba */

export function Option({
  label,
  selected,
  onClick,
  icon,
  muted,
}: {
  label: string
  selected?: boolean
  onClick?: () => void
  icon?: ReactNode
  muted?: boolean
}) {
  const classes = ['option']
  if (muted) classes.push('option--muted')
  if (selected) classes.push('option--selected')
  return (
    <button className={classes.join(' ')} onClick={onClick}>
      {icon}
      <span className="option__label">{label}</span>
      {selected && <Check size={20} className="option__check" strokeWidth={2} />}
    </button>
  )
}

/* -------------------------------------------------------------------- chipy */

export function Chip({
  label,
  active,
  onClick,
  onRemove,
}: {
  label: string
  active?: boolean
  onClick?: () => void
  onRemove?: () => void
}) {
  return (
    <button className={`chip${active ? ' chip--active' : ''}`} onClick={onClick}>
      {label}
      {onRemove && (
        <X
          size={14}
          strokeWidth={2.4}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        />
      )}
    </button>
  )
}

/* ------------------------------------------------------------- bottom sheet */

export function Sheet({
  title,
  onClose,
  children,
  footer,
  tall,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  tall?: boolean
}) {
  const { t } = useT()
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <section className={`sheet${tall ? ' sheet--tall' : ''}`}>
        <header className="sheet__head">
          <h2 className="sheet__title">{title}</h2>
          <button className="sheet__close" onClick={onClose} aria-label={t('close')}>
            <X size={24} strokeWidth={1.8} />
          </button>
        </header>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__footer">{footer}</div>}
      </section>
    </>
  )
}

/* --------------------------------------------------------- numerická klávesnice */

const KEYS: [string, string][] = [
  ['1', ''],
  ['2', 'ABC'],
  ['3', 'DEF'],
  ['4', 'GHI'],
  ['5', 'JKL'],
  ['6', 'MNO'],
  ['7', 'PQRS'],
  ['8', 'TUV'],
  ['9', 'WXYZ'],
]

export function Numpad({ onKey, onDelete }: { onKey: (d: string) => void; onDelete: () => void }) {
  return (
    <div className="numpad">
      {KEYS.map(([d, letters]) => (
        <button key={d} className="numpad__key" onClick={() => onKey(d)}>
          <span>
            {d}
            {letters && (
              <>
                <br />
                <small>{letters}</small>
              </>
            )}
          </span>
        </button>
      ))}
      <span className="numpad__key numpad__key--plain" style={{ fontSize: 18 }}>
        + * #
      </span>
      <button className="numpad__key" onClick={() => onKey('0')}>
        0
      </button>
      <button className="numpad__key numpad__key--plain" onClick={onDelete} aria-label="Smazat">
        <Delete size={24} strokeWidth={1.5} />
      </button>
    </div>
  )
}

/* --------------------------------------------------------------------- toast */

export function Toast({ message }: { message: string }) {
  return <div className="toast">{message}</div>
}
