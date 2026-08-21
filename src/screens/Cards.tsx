import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowDownUp,
  Clock,
  Copy,
  CreditCard as CreditCardIcon,
  Eye,
  KeyRound,
  Lock,
  LockOpen,
  ReceiptText,
  XCircle,
} from 'lucide-react'
import { useApp } from '../store/useApp'
import { useT } from '../lib/useT'
import { digitsToAmount, money, number } from '../lib/format'
import type { Card as CardModel, Currency } from '../domain/types'
import { BottomNav } from '../components/BottomNav'
import { Button, Chip, Numpad, Option, Sheet, TopBar } from '../components/ui'

const FILTERS: (Currency | 'ALL')[] = ['ALL', 'CZK', 'USD', 'EUR']

function accountForCurrency(accounts: { id: string; currency: Currency }[], currency: Currency) {
  return accounts.find((a) => a.currency === currency)?.id
}

export function Cards() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const cards = useApp((s) => s.cards)
  const accounts = useApp((s) => s.accounts)
  const generateCard = useApp((s) => s.generateCard)
  const showToast = useApp((s) => s.showToast)
  const [filter, setFilter] = useState<Currency | 'ALL'>('ALL')

  const visible = cards.filter((c) => !c.cancelled && (filter === 'ALL' || c.currency === filter))

  return (
    <div className="screen">
      <TopBar title={t('cardsTitle')} center />
      <div className="screen__body">
        <div className="chips" style={{ marginBottom: 16 }}>
          {FILTERS.map((f) => (
            <Chip
              key={f}
              label={f === 'ALL' ? t('all') : f}
              active={filter === f}
              onClick={() => setFilter(f)}
            />
          ))}
        </div>
        <div className="stack" style={{ paddingBottom: 110 }}>
          {visible.map((card) => {
            const account = accounts.find((a) => a.id === card.accountId)
            return (
              <button key={card.id} onClick={() => navigate(`/app/cards/${card.id}`)}>
                <PaymentCard
                  card={card}
                  balance={money(account?.balance ?? 0, card.currency, lang)}
                />
              </button>
            )
          })}

          {/* Bez tohohle by zrušení poslední karty byla slepá ulička. */}
          {visible.length === 0 && (
            <div style={{ display: 'grid', gap: 18, placeItems: 'center', marginTop: 60 }}>
              <CreditCardIcon size={44} strokeWidth={1.3} style={{ color: 'var(--primary)' }} />
              <span className="muted">{t('noCards')}</span>
              <Button
                onClick={() => {
                  generateCard(filter === 'ALL' ? 'acc-czk' : (accountForCurrency(accounts, filter) ?? 'acc-czk'))
                  showToast(t('done'))
                }}
              >
                {t('generateNew')}
              </Button>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

export function PaymentCard({ card, balance }: { card: CardModel; balance: string }) {
  const { t } = useT()
  return (
    <div
      style={{
        background: `linear-gradient(120deg, var(--card-from), var(--card-to))`,
        borderRadius: 'var(--r-sm)',
        color: '#fff',
        padding: '18px 20px 20px',
        display: 'grid',
        gap: 18,
        textAlign: 'left',
        opacity: card.state === 'locked' ? 0.65 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="row">
        <VisaMark />
        <span className="spacer" />
        <span style={{ letterSpacing: '0.04em' }}>****{card.last4}</span>
      </div>

      {/* Značka LargoVerse — vpravo dole, aby nekolidovala s VISA ani s číslem karty. */}
      <div
        className="tree-mark"
        aria-hidden
        style={{
          position: 'absolute',
          right: 18,
          bottom: 16,
          width: 54,
          height: 52,
          backgroundColor: '#ffffff',
          opacity: 0.28,
          pointerEvents: 'none',
        }}
      />
      <div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>{t('cardTitle')}</div>
        <div style={{ fontSize: 24, fontWeight: 500 }}>{balance}</div>
      </div>
      <div className="row" style={{ gap: 32, fontSize: 13 }}>
        <span>
          <span style={{ opacity: 0.75, display: 'block' }}>{t('expires')}</span>
          {card.expiry}
        </span>
        <span>
          <span style={{ opacity: 0.75, display: 'block' }}>{t('name')}</span>
          {card.holder}
        </span>
      </div>
    </div>
  )
}

function VisaMark() {
  return (
    <span style={{ fontStyle: 'italic', fontWeight: 800, fontSize: 20, letterSpacing: '-0.04em' }}>
      VISA
    </span>
  )
}

/* ------------------------------------------------------------- detail karty */

type SheetKind = 'state' | 'pin' | 'newPin' | 'details' | 'limits' | 'newLimit' | 'cancel' | 'generate' | null
type LimitKey = 'merchant' | 'cash' | 'internet'

export function CardDetail() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const { cardId } = useParams()
  const cards = useApp((s) => s.cards)
  const accounts = useApp((s) => s.accounts)
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [limitKey, setLimitKey] = useState<LimitKey>('merchant')

  const card = cards.find((c) => c.id === cardId)
  if (!card) return <div className="screen" />
  const account = accounts.find((a) => a.id === card.accountId)

  return (
    <div className="screen">
      <TopBar title={t('cardTitle')} onBack={() => navigate('/app/cards')} />
      <div className="screen__body">
        <PaymentCard card={card} balance={money(account?.balance ?? 0, card.currency, lang)} />

        <div className="row" style={{ gap: 10, margin: '16px 0' }}>
          <QuickAction
            icon={card.state === 'active' ? <LockOpen size={24} strokeWidth={1.6} /> : <Lock size={24} strokeWidth={1.6} />}
            label={t('cardState')}
            onClick={() => setSheet('state')}
          />
          <QuickAction icon={<KeyRound size={24} strokeWidth={1.6} />} label={t('cardPin')} onClick={() => setSheet('pin')} />
          <QuickAction icon={<ArrowDownUp size={24} strokeWidth={1.6} />} label={t('cardLimits')} onClick={() => setSheet('limits')} />
        </div>

        <div className="menu-list" style={{ marginBottom: 110 }}>
          <MenuRow icon={<Eye size={20} strokeWidth={1.7} />} label={t('showDetails')} onClick={() => setSheet('details')} />
          <MenuRow
            icon={<ReceiptText size={20} strokeWidth={1.7} />}
            label={t('txList')}
            onClick={() => navigate(`/app/transactions/${card.accountId}`)}
          />
          <MenuRow icon={<XCircle size={20} strokeWidth={1.7} />} label={t('cancelCard')} onClick={() => setSheet('cancel')} />
          <MenuRow icon={<CreditCardIcon size={20} strokeWidth={1.7} />} label={t('generateNew')} onClick={() => setSheet('generate')} />
        </div>
      </div>

      {sheet === 'state' && <CardStateSheet card={card} onClose={() => setSheet(null)} />}
      {sheet === 'pin' && <PinSheet card={card} onClose={() => setSheet(null)} onChange={() => setSheet('newPin')} />}
      {sheet === 'newPin' && <NewPinSheet card={card} onClose={() => setSheet(null)} />}
      {sheet === 'details' && <CardDetailsSheet card={card} onClose={() => setSheet(null)} />}
      {sheet === 'limits' && (
        <LimitsSheet
          card={card}
          onClose={() => setSheet(null)}
          onPick={(k) => {
            setLimitKey(k)
            setSheet('newLimit')
          }}
        />
      )}
      {sheet === 'newLimit' && <NewLimitSheet card={card} limitKey={limitKey} onClose={() => setSheet(null)} />}
      {sheet === 'cancel' && <ConfirmSheet title={t('cancelCardTitle')} onClose={() => setSheet(null)} cardId={card.id} action="cancel" />}
      {sheet === 'generate' && (
        <ConfirmSheet title={t('generateNewCardTitle')} onClose={() => setSheet(null)} cardId={card.id} action="generate" />
      )}
    </div>
  )
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: 'var(--surface-muted)',
        borderRadius: 'var(--r-sm)',
        padding: '16px 8px 12px',
        display: 'grid',
        placeItems: 'center',
        gap: 8,
      }}
    >
      {icon}
      <span style={{ fontSize: 14 }}>{label}</span>
    </button>
  )
}

function MenuRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button className="menu-list__item" onClick={onClick}>
      {icon}
      <span className="menu-list__label">{label}</span>
      <span className="muted">›</span>
    </button>
  )
}

/* ----------------------------------------------------------------- sheety */

function CardStateSheet({ card, onClose }: { card: CardModel; onClose: () => void }) {
  const { t } = useT()
  const setCardState = useApp((s) => s.setCardState)
  const showToast = useApp((s) => s.showToast)
  const [value, setValue] = useState(card.state)

  return (
    <Sheet
      title={t('cardStateTitle')}
      onClose={onClose}
      tall
      footer={
        <Button
          onClick={() => {
            setCardState(card.id, value)
            showToast(t('done'))
            onClose()
          }}
        >
          {t('save')}
        </Button>
      }
    >
      <div className="stack">
        <Option
          muted
          label={t('active')}
          icon={<LockOpen size={20} strokeWidth={1.7} />}
          selected={value === 'active'}
          onClick={() => setValue('active')}
        />
        <Option
          muted
          label={t('locked')}
          icon={<Lock size={20} strokeWidth={1.7} />}
          selected={value === 'locked'}
          onClick={() => setValue('locked')}
        />
      </div>
    </Sheet>
  )
}

function useCountdown(seconds: number, active: boolean) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (!active) {
      setLeft(seconds)
      return
    }
    const id = window.setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000)
    return () => window.clearInterval(id)
  }, [active, seconds])
  return `00:${String(left).padStart(2, '0')}`
}

function RevealBox({ children, timer }: { children: React.ReactNode; timer: string }) {
  return (
    <div style={{ background: 'var(--surface-muted)', borderRadius: 'var(--r-md)', padding: 20 }}>
      <div style={{ display: 'grid', placeItems: 'center', marginBottom: 14 }}>
        <span
          className="row"
          style={{
            gap: 6,
            background: 'rgba(11,32,39,.08)',
            borderRadius: 999,
            padding: '3px 10px',
            fontSize: 13,
          }}
        >
          <Clock size={14} /> {timer}
        </span>
      </div>
      {children}
    </div>
  )
}

function PinSheet({ card, onClose, onChange }: { card: CardModel; onClose: () => void; onChange: () => void }) {
  const { t } = useT()
  const [shown, setShown] = useState(false)
  const timer = useCountdown(17, shown)

  return (
    <Sheet
      title={t('yourPin')}
      onClose={onClose}
      tall
      footer={
        <>
          <Button onClick={() => setShown(!shown)}>{t(shown ? 'hide' : 'show')}</Button>
          <Button variant="ghost" onClick={onChange}>
            {t('change')}
          </Button>
        </>
      }
    >
      <RevealBox timer={timer}>
        <div style={{ textAlign: 'center', fontSize: 22, letterSpacing: '0.5em', paddingLeft: '0.5em' }}>
          {shown ? card.pin.split('').join(' ') : '••••'}
        </div>
        <p className="muted" style={{ textAlign: 'center', marginBottom: 0, marginTop: 14, fontSize: 14 }}>
          {t('pinFor', { last4: card.last4 })}
        </p>
      </RevealBox>
    </Sheet>
  )
}

function NewPinSheet({ card, onClose }: { card: CardModel; onClose: () => void }) {
  const { t } = useT()
  const setCardPin = useApp((s) => s.setCardPin)
  const showToast = useApp((s) => s.showToast)
  const [pin, setPin] = useState('')

  return (
    <Sheet
      title={t('setNewPin')}
      onClose={onClose}
      tall
      footer={
        <>
          <Button
            disabled={pin.length !== 4}
            onClick={() => {
              setCardPin(card.id, pin)
              showToast(t('done'))
              onClose()
            }}
          >
            {t('confirm')}
          </Button>
          <Numpad
            onKey={(d) => setPin((v) => (v.length < 4 ? v + d : v))}
            onDelete={() => setPin((v) => v.slice(0, -1))}
          />
        </>
      }
    >
      <div
        style={{
          background: 'var(--surface-muted)',
          borderRadius: 'var(--r-md)',
          padding: '34px 20px 20px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: '0.5em', paddingLeft: '0.5em', minHeight: 32 }}>
          {pin.replace(/./g, '•') || <span style={{ opacity: 0.3 }}>|</span>}
        </div>
        <p className="muted" style={{ marginBottom: 0, marginTop: 26, fontSize: 14 }}>
          {t('enterNewPin', { last4: card.last4 })}
        </p>
      </div>
    </Sheet>
  )
}

function CardDetailsSheet({ card, onClose }: { card: CardModel; onClose: () => void }) {
  const { t } = useT()
  const showToast = useApp((s) => s.showToast)
  const [shown, setShown] = useState(false)
  const timer = useCountdown(17, shown)

  const row = (label: string, value: string, copyable?: boolean) => (
    <div className="row" style={{ alignItems: 'flex-start', marginBottom: 14 }}>
      <span style={{ flex: 1 }}>
        <span className="field__label" style={{ display: 'block' }}>
          {label}
        </span>
        <span style={{ fontSize: 16 }}>{value}</span>
      </span>
      {copyable && shown && (
        <button className="link" onClick={() => showToast(t('copied'))} aria-label={t('copied')}>
          <Copy size={20} strokeWidth={1.7} />
        </button>
      )}
    </div>
  )

  return (
    <Sheet
      title={t('cardDetailsTitle')}
      onClose={onClose}
      tall
      footer={<Button onClick={() => setShown(!shown)}>{t(shown ? 'hide' : 'show')}</Button>}
    >
      <RevealBox timer={timer}>
        {row(t('cardNumber'), shown ? card.number : '•••• •••• •••• ••••', true)}
        {row(t('validThru'), card.expiry)}
        {row(t('cvv'), shown ? card.cvv : '•••')}
      </RevealBox>
    </Sheet>
  )
}

const LIMIT_KEYS: LimitKey[] = ['merchant', 'cash', 'internet']
const LIMIT_LABEL: Record<LimitKey, 'merchantPayments' | 'cashWithdrawal' | 'internetPayments'> = {
  merchant: 'merchantPayments',
  cash: 'cashWithdrawal',
  internet: 'internetPayments',
}

function LimitsSheet({
  card,
  onClose,
  onPick,
}: {
  card: CardModel
  onClose: () => void
  onPick: (k: LimitKey) => void
}) {
  const { t, lang } = useT()
  return (
    <Sheet title={t('changeLimits')} onClose={onClose} tall>
      <div className="menu-list">
        {LIMIT_KEYS.map((k) => (
          <button key={k} className="menu-list__item" onClick={() => onPick(k)}>
            <span className="menu-list__label">
              {t(LIMIT_LABEL[k])}
              <span className="menu-list__sub" style={{ display: 'block' }}>
                {money(card.limits[k], card.currency, lang)}
              </span>
            </span>
            <span className="muted">›</span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}

function NewLimitSheet({
  card,
  limitKey,
  onClose,
}: {
  card: CardModel
  limitKey: LimitKey
  onClose: () => void
}) {
  const { t, lang } = useT()
  const setCardLimit = useApp((s) => s.setCardLimit)
  const showToast = useApp((s) => s.showToast)
  const [digits, setDigits] = useState('')
  const value = digitsToAmount(digits)
  const max = card.limits[limitKey] * 10

  return (
    <Sheet
      title={t('setNewLimit')}
      onClose={onClose}
      tall
      footer={
        <>
          <Button
            disabled={value <= 0 || value > max}
            onClick={() => {
              setCardLimit(card.id, limitKey, value)
              showToast(t('done'))
              onClose()
            }}
          >
            {t('confirm')}
          </Button>
          <Numpad
            onKey={(d) => setDigits((v) => (v.length < 9 ? v + d : v))}
            onDelete={() => setDigits((v) => v.slice(0, -1))}
          />
        </>
      }
    >
      <p className="muted" style={{ margin: '-8px 0 12px' }}>
        {t('forLimit', { what: t(LIMIT_LABEL[limitKey]).toLowerCase() })}
      </p>
      <div
        style={{
          background: 'var(--surface-muted)',
          borderRadius: 'var(--r-md)',
          padding: '30px 20px 22px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 400 }}>
          {number(value, lang)} {card.currency}
        </div>
        <p className="muted" style={{ marginTop: 22, marginBottom: 0, fontSize: 14 }}>
          {t('currentLimit', { value: money(card.limits[limitKey], card.currency, lang) })}
          <br />
          {t('maxLimit', { value: money(max, card.currency, lang) })}
        </p>
      </div>
    </Sheet>
  )
}

function ConfirmSheet({
  title,
  onClose,
  cardId,
  action,
}: {
  title: string
  onClose: () => void
  cardId: string
  action: 'cancel' | 'generate'
}) {
  const { t } = useT()
  const navigate = useNavigate()
  const cancelCard = useApp((s) => s.cancelCard)
  const generateCard = useApp((s) => s.generateCard)
  const cards = useApp((s) => s.cards)
  const showToast = useApp((s) => s.showToast)

  const run = () => {
    const card = cards.find((c) => c.id === cardId)
    if (action === 'cancel') {
      cancelCard(cardId)
      showToast(t('done'))
      onClose()
      navigate('/app/cards')
    } else {
      if (card) generateCard(card.accountId)
      showToast(t('done'))
      onClose()
      navigate('/app/cards')
    }
  }

  return (
    <Sheet
      title={title}
      onClose={onClose}
      tall
      footer={<Button onClick={run}>{t('confirm')}</Button>}
    >
      <p className="muted" style={{ marginTop: -6 }}>
        {t('legalBlurb')}
      </p>
    </Sheet>
  )
}
