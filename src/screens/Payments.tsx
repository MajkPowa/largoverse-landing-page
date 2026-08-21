import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Banknote,
  Camera,
  ChevronDown,
  ChevronUp,
  Globe,
  Landmark,
  MessageSquareText,
  ReceiptText,
  RefreshCw,
  Share2,
  UserRound,
} from 'lucide-react'
import { useApp } from '../store/useApp'
import { useT } from '../lib/useT'
import { money, number } from '../lib/format'
import { convert, TRANSFER_FEE_CZK, type Payee } from '../domain/types'
import { Button, Chip, Field, MenuItem, Sheet, TopBar } from '../components/ui'
import { AccountSelect } from '../components/Amount'
import { UploadGlyph } from './Dashboard'

type Mode = 'menu' | 'payment' | 'p2p' | 'own' | 'qr'

export function NewPaymentSheet({ onClose }: { onClose: () => void }) {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const accounts = useApp((s) => s.accounts)
  const payees = useApp((s) => s.payees)
  const [mode, setMode] = useState<Mode>('menu')
  const [ownTarget, setOwnTarget] = useState(accounts[1]?.id ?? '')
  const [prefill, setPrefill] = useState<Payee | null>(null)

  if (mode === 'payment') return <PaymentForm onClose={onClose} variant="account" prefill={prefill} />
  if (mode === 'p2p') return <PaymentForm onClose={onClose} variant="p2p" prefill={null} />
  if (mode === 'own') return <OwnTransferForm onClose={onClose} targetId={ownTarget} />
  if (mode === 'qr') return <CreateQrForm onClose={onClose} />

  return (
    <Sheet title={t('newPayment')} onClose={onClose}>
      <div className="menu-list">
        <MenuItem
          icon={<UploadGlyph />}
          label={t('enterPayment')}
          sub={t('enterPaymentSub')}
          onClick={() => setMode('payment')}
        />
        <MenuItem
          icon={<UserRound size={20} strokeWidth={1.7} />}
          label={t('sendP2P')}
          sub={t('sendP2PSub')}
          onClick={() => setMode('p2p')}
        />
        <MenuItem
          icon={<Camera size={20} strokeWidth={1.7} />}
          label={t('photoAndSend')}
          sub={t('photoAndSendSub')}
          onClick={() => navigate('/app/scan')}
        />
      </div>

      {/* Šablony — prezentující nemusí vypisovat číslo účtu ani částku. */}
      <h3 className="section-title" style={{ fontSize: 16, margin: '20px 0 10px' }}>
        {t('templates')}
      </h3>
      <div className="stack">
        {payees.map((p) => (
          <button
            key={p.id}
            className="card row"
            style={{ width: '100%', textAlign: 'left', gap: 12 }}
            onClick={() => {
              setPrefill(p)
              setMode('payment')
            }}
          >
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--r-sm)',
                background: 'var(--primary-soft)',
                color: 'var(--primary)',
                display: 'grid',
                placeItems: 'center',
                flex: 'none',
              }}
            >
              <RefreshCw size={18} strokeWidth={1.7} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block' }}>{p.name}</span>
              <span className="listrow__sub">{p.accountNumber}</span>
            </span>
            {p.amount && <strong>{money(p.amount, p.currency, lang)}</strong>}
          </button>
        ))}
      </div>

      <h3 className="section-title" style={{ fontSize: 16, margin: '20px 0 10px' }}>
        {t('transferOwn')}
      </h3>
      <div className="stack">
        {accounts.slice(1).map((a) => (
          <button
            key={a.id}
            className="card row"
            style={{ width: '100%', textAlign: 'left' }}
            onClick={() => {
              setOwnTarget(a.id)
              setMode('own')
            }}
          >
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block' }}>{t(a.kind)}</span>
              <span className="listrow__sub">{a.number}</span>
              <strong style={{ display: 'block', marginTop: 4 }}>
                {money(a.balance, a.currency, lang)}
              </strong>
            </span>
          </button>
        ))}
      </div>
      <div style={{ height: 12 }} />
      <Button variant="ghost" onClick={() => setMode('qr')}>
        {t('createQr')}
      </Button>
    </Sheet>
  )
}

function PaymentForm({
  onClose,
  variant,
  prefill,
}: {
  onClose: () => void
  variant: 'account' | 'p2p'
  prefill: Payee | null
}) {
  const { t } = useT()
  const pay = useApp((s) => s.pay)
  const accounts = useApp((s) => s.accounts)
  const contacts = useApp((s) => s.contacts)
  const showToast = useApp((s) => s.showToast)

  /*
   * Z jakého účtu se platí. Šablona s částkou v cizí měně si vybere účet
   * ve své měně, jinak se platí z prvního (korunového) — nejčastější případ.
   */
  const [fromId, setFromId] = useState(
    (prefill && accounts.find((a) => a.currency === prefill.currency)?.id) ?? accounts[0]?.id ?? '',
  )
  const source = accounts.find((a) => a.id === fromId) ?? accounts[0]

  const [target, setTarget] = useState(prefill?.accountNumber ?? '')
  const [name, setName] = useState(prefill?.name ?? '')
  const [amount, setAmount] = useState(prefill?.amount ? String(prefill.amount) : '')
  const [note, setNote] = useState(prefill?.noteKey ? t(prefill.noteKey) : '')

  // Tuzemská platba jede na číslo účtu se symboly, zahraniční na IBAN a SWIFT.
  const [abroad, setAbroad] = useState(false)
  const [iban, setIban] = useState('')
  const [swift, setSwift] = useState('')
  const [vs, setVs] = useState('')
  const [ks, setKs] = useState('')
  const [ss, setSs] = useState('')
  const [symbolsOpen, setSymbolsOpen] = useState(false)

  const value = Number(amount.replace(',', '.'))
  const recipientFilled = variant === 'p2p' ? target.trim() !== '' : abroad ? iban.trim() !== '' : target.trim() !== ''
  const ready = recipientFilled && value > 0 && (variant === 'p2p' || name.trim() !== '')

  /** Jen číslice, s omezením délky podle konvence ČNB. */
  const digits = (max: number) => (v: string) => v.replace(/\D/g, '').slice(0, max)

  const submit = () => {
    const symbolNote = [vs && `VS ${vs}`, ks && `KS ${ks}`, ss && `SS ${ss}`].filter(Boolean).join(' · ')
    const ok = pay({
      accountId: fromId,
      // Vybraný kontakt má jméno — v historii vypadá líp než e-mail.
      title: name.trim() || target,
      amount: value,
      note: [note.trim(), symbolNote].filter(Boolean).join(' — '),
    })
    showToast(t(ok ? 'paymentSent' : 'insufficientFunds'))
    if (ok) onClose()
  }

  return (
    <Sheet
      title={t(variant === 'p2p' ? 'sendP2P' : 'enterPayment')}
      onClose={onClose}
      footer={
        <Button disabled={!ready} onClick={submit}>
          {t('send')}
        </Button>
      }
    >
      {/* Z jakého účtu — a tím i v jaké měně — se platba provede. */}
      <AccountSelect
        accounts={accounts}
        value={fromId}
        onChange={setFromId}
        label={t('fromAccount')}
      />
      <p className="muted" style={{ fontSize: 12, margin: '6px 0 14px' }}>
        {t('amountIn', { currency: source?.currency ?? 'CZK' })}
      </p>

      {/* Kontakty — klepnutím se vyplní příjemce, nic se nepíše z hlavy. */}
      {variant === 'p2p' && (
        <div className="chips" style={{ marginBottom: 14 }}>
          {contacts.map((c) => (
            <button
              key={c.id}
              className={`chip${target === c.email ? ' chip--active' : ''}`}
              onClick={() => {
                setTarget(c.email)
                setName(c.name)
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: target === c.email ? 'rgba(255,255,255,.22)' : 'var(--primary-soft)',
                  color: target === c.email ? '#fff' : 'var(--primary)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {c.initials}
              </span>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Přepínač tuzemská / zahraniční — mění, co se od uživatele chce. */}
      {variant === 'account' && (
        <div className="chips" style={{ marginBottom: 14 }}>
          <Chip label={t('paymentDomestic')} active={!abroad} onClick={() => setAbroad(false)} />
          <Chip label={t('paymentForeign')} active={abroad} onClick={() => setAbroad(true)} />
        </div>
      )}

      <div className="stack">
        {variant === 'p2p' ? (
          <Field
            muted
            icon={<UserRound size={20} strokeWidth={1.7} />}
            value={target}
            onChange={setTarget}
            placeholder={t('recipientEmail')}
          />
        ) : abroad ? (
          <>
            <Field
              muted
              icon={<Globe size={20} strokeWidth={1.7} />}
              value={iban}
              onChange={(v) => setIban(v.toUpperCase())}
              placeholder={t('iban')}
            />
            <Field
              muted
              icon={<Landmark size={20} strokeWidth={1.7} />}
              value={swift}
              onChange={(v) => setSwift(v.toUpperCase())}
              placeholder={t('bic')}
            />
            <Field
              muted
              icon={<UserRound size={20} strokeWidth={1.7} />}
              value={name}
              onChange={setName}
              placeholder={t('recipientName')}
            />
          </>
        ) : (
          <>
            <Field
              muted
              icon={<ReceiptText size={20} strokeWidth={1.7} />}
              value={target}
              onChange={setTarget}
              placeholder={t('recipientAccount')}
            />
            <Field
              muted
              icon={<UserRound size={20} strokeWidth={1.7} />}
              value={name}
              onChange={setName}
              placeholder={t('recipientName')}
            />
          </>
        )}
        <Field
          muted
          icon={<Banknote size={20} strokeWidth={1.7} />}
          value={amount}
          onChange={setAmount}
          placeholder={t('amount')}
        />
        <Field
          muted
          icon={<MessageSquareText size={20} strokeWidth={1.7} />}
          value={note}
          onChange={setNote}
          placeholder={t('messageForRecipient')}
        />
      </div>

      {/* Symboly jsou u tuzemské platby volitelné — proto schované pod rozbalovátkem. */}
      {variant === 'account' && !abroad && (
        <div style={{ marginTop: 14 }}>
          <button
            className="row"
            style={{ gap: 6, color: 'var(--primary)', fontWeight: 600, fontSize: 14 }}
            onClick={() => setSymbolsOpen(!symbolsOpen)}
          >
            {symbolsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            {t('paymentSymbols')}
          </button>

          {symbolsOpen && (
            <div className="stack" style={{ marginTop: 10 }}>
              <Field
                muted
                label={t('variableSymbol')}
                value={vs}
                onChange={(v) => setVs(digits(10)(v))}
                placeholder={t('variableSymbol')}
              />
              <Field
                muted
                label={t('constantSymbol')}
                value={ks}
                onChange={(v) => setKs(digits(4)(v))}
                placeholder={t('constantSymbol')}
              />
              <Field
                muted
                label={t('specificSymbol')}
                value={ss}
                onChange={(v) => setSs(digits(10)(v))}
                placeholder={t('specificSymbol')}
              />
            </div>
          )}
        </div>
      )}
    </Sheet>
  )
}

function OwnTransferForm({ onClose, targetId }: { onClose: () => void; targetId: string }) {
  const { t, lang } = useT()
  const accounts = useApp((s) => s.accounts)
  const transferOwn = useApp((s) => s.transferOwn)
  const showToast = useApp((s) => s.showToast)
  const [amount, setAmount] = useState('300')

  const to = accounts.find((a) => a.id === targetId) ?? accounts[1]
  // Zdrojový účet si volí uživatel; cílový se sem předává z nabídky.
  const [fromId, setFromId] = useState(accounts.find((a) => a.id !== to.id)?.id ?? accounts[0].id)
  const from = accounts.find((a) => a.id === fromId) ?? accounts[0]
  const value = Number(amount.replace(',', '.')) || 0
  const rate = convert(1, to.currency, from.currency)
  const debited = convert(value, to.currency, from.currency) + TRANSFER_FEE_CZK

  return (
    <Sheet
      title={t('toOwnAccount')}
      onClose={onClose}
      footer={
        <Button
          disabled={value <= 0}
          onClick={() => {
            const ok = transferOwn({
              fromId: from.id,
              toId: to.id,
              amount: convert(value, to.currency, from.currency),
            })
            showToast(t(ok ? 'paymentSent' : 'insufficientFunds'))
            if (ok) onClose()
          }}
        >
          {t('send')}
        </Button>
      }
    >
      {/* Odkud se převádí — cíl je daný výběrem v nabídce. */}
      <div style={{ marginBottom: 14 }}>
        <AccountSelect
          accounts={accounts.filter((a) => a.id !== to.id)}
          value={fromId}
          onChange={setFromId}
          label={t('fromAccount')}
        />
      </div>

      <div className="stack">
        <Field muted icon={<ReceiptText size={20} strokeWidth={1.7} />} value={to.number} readOnly />
        <Field muted icon={<UserRound size={20} strokeWidth={1.7} />} value="Ondrej Veverka" readOnly />
        <Field
          muted
          icon={<Banknote size={20} strokeWidth={1.7} />}
          value={`${amount}`}
          onChange={setAmount}
          placeholder={`${t('amount')} ${to.currency}`}
        />
      </div>
      <div style={{ marginTop: 20, display: 'grid', gap: 4 }}>
        <span className="muted">
          {t('currentRate', {
            from: to.currency,
            rate: number(rate, lang),
            to: from.currency,
          })}
        </span>
        <span className="muted">{t('fee', { value: money(TRANSFER_FEE_CZK, 'CZK', lang) })}</span>
        <strong style={{ marginTop: 8 }}>
          {t('willBeDebited', { value: money(debited, from.currency, lang) })}
        </strong>
      </div>
    </Sheet>
  )
}

function CreateQrForm({ onClose }: { onClose: () => void }) {
  const { t } = useT()
  const showToast = useApp((s) => s.showToast)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  return (
    <Sheet title={t('createQr')} onClose={onClose}>
      <div className="field-group">
        <Field
          icon={<Banknote size={20} strokeWidth={1.7} />}
          value={amount}
          onChange={setAmount}
          placeholder={t('amountIn', { currency: 'CZK' })}
        />
        <Field
          icon={<MessageSquareText size={20} strokeWidth={1.7} />}
          value={note}
          onChange={setNote}
          placeholder={t('messageForMe')}
        />
      </div>

      <div className="card" style={{ marginTop: 16, display: 'grid', gap: 16, paddingBottom: 16 }}>
        <QrArt seed={`${amount}|${note}`} />
        <Button icon={<Share2 size={18} />} onClick={() => showToast(t('shareQr'))}>
          {t('shareQr')}
        </Button>
      </div>
    </Sheet>
  )
}

/** Dekorativní QR – vizuálně odpovídá návrhu, nenese data. */
export function QrArt({ seed = 'largo', size = 232 }: { seed?: string; size?: number }) {
  const cells = 21
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const rand = (i: number) => {
    const x = Math.sin(h + i * 12.9898) * 43758.5453
    return x - Math.floor(x)
  }

  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7)

  const rects: React.ReactElement[] = []
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (isFinder(r, c)) continue
      if (rand(r * cells + c) > 0.53) {
        rects.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" />)
      }
    }
  }

  const finder = (x: number, y: number) => (
    <g key={`f-${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" />
    </g>
  )

  return (
    <svg
      viewBox={`0 0 ${cells} ${cells}`}
      width={size}
      height={size}
      style={{ margin: '0 auto', display: 'block' }}
      shapeRendering="crispEdges"
      aria-hidden
    >
      <rect width={cells} height={cells} fill="#fff" />
      <g fill="#0b2027">
        {rects}
        {finder(0, 0)}
        {finder(cells - 7, 0)}
        {finder(0, cells - 7)}
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------- QR skener */

export function ScanQr() {
  const { t } = useT()
  const navigate = useNavigate()
  const showToast = useApp((s) => s.showToast)

  return (
    <div className="screen" style={{ background: '#1b2427' }}>
      <TopBar
        title={t('scanQr')}
        onBack={() => navigate(-1)}
        right={<span style={{ width: 24 }} />}
      />
      <div
        className="screen__body screen__body--flush"
        style={{ position: 'relative', display: 'grid', placeItems: 'center' }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '12% 10%',
            borderRadius: 8,
            background:
              'linear-gradient(140deg, rgba(255,255,255,.05), rgba(255,255,255,.02))',
          }}
        />
        <Corners />
        <button
          onClick={() => {
            showToast(t('paymentSent'))
            navigate('/app')
          }}
          style={{ position: 'relative', width: 190, opacity: 0.92 }}
          aria-label={t('scanQr')}
        >
          <QrArt seed="scan" size={190} />
        </button>
      </div>
    </div>
  )
}

function Corners() {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: '#fff',
    borderStyle: 'solid',
    borderWidth: 0,
  }
  return (
    <>
      <span style={{ ...base, top: '9%', left: '8%', borderTopWidth: 3, borderLeftWidth: 3 }} />
      <span style={{ ...base, top: '9%', right: '8%', borderTopWidth: 3, borderRightWidth: 3 }} />
      <span style={{ ...base, bottom: '9%', left: '8%', borderBottomWidth: 3, borderLeftWidth: 3 }} />
      <span style={{ ...base, bottom: '9%', right: '8%', borderBottomWidth: 3, borderRightWidth: 3 }} />
    </>
  )
}
