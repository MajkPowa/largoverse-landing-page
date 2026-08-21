import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, QrCode, ReceiptText, Share2 } from 'lucide-react'
import { useApp } from '../store/useApp'
import { useT } from '../lib/useT'
import { money } from '../lib/format'
import type { Account, Currency } from '../domain/types'
import { BottomNav } from '../components/BottomNav'
import { Chip, Sheet, TopBar } from '../components/ui'
import { NewPaymentSheet, QrArt } from './Payments'

const FILTERS: (Currency | 'ALL')[] = ['ALL', 'CZK', 'USD', 'EUR']

export function Accounts() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const accounts = useApp((s) => s.accounts)
  const [filter, setFilter] = useState<Currency | 'ALL'>('ALL')
  const [detail, setDetail] = useState<Account | null>(null)
  const [qr, setQr] = useState<Account | null>(null)
  const [payment, setPayment] = useState(false)

  const visible = accounts.filter((a) => filter === 'ALL' || a.currency === filter)

  return (
    <div className="screen">
      <TopBar title={t('accountsTitle')} center />
      <div className="screen__body">
        <div className="chips" style={{ marginBottom: 16 }}>
          {FILTERS.map((f) => (
            <Chip key={f} label={f === 'ALL' ? t('all') : f} active={filter === f} onClick={() => setFilter(f)} />
          ))}
        </div>

        <div className="stack" style={{ paddingBottom: 110 }}>
          {visible.map((a) => (
            <div key={a.id} className="card">
              <div className="muted" style={{ fontSize: 16 }}>
                {t(a.kind)}
              </div>
              <div style={{ fontSize: 26, fontWeight: 500, marginBottom: 14 }}>
                {money(a.balance, a.currency, lang)}
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button
                  className="row"
                  style={{
                    background: 'var(--surface-muted)',
                    borderRadius: 'var(--r-sm)',
                    padding: '12px 14px',
                    gap: 8,
                    flex: 1,
                  }}
                  onClick={() => setDetail(a)}
                >
                  <ReceiptText size={20} strokeWidth={1.6} />
                  <span style={{ fontSize: 14 }}>{t('accountDetails')}</span>
                </button>
                <IconBtn onClick={() => setPayment(true)} label={t('newPayment')}>
                  <Share2 size={20} strokeWidth={1.6} />
                </IconBtn>
                <IconBtn onClick={() => navigate(`/app/transactions/${a.id}`)} label={t('txList')}>
                  <ReceiptText size={20} strokeWidth={1.6} />
                </IconBtn>
                <IconBtn onClick={() => setQr(a)} label={t('createQr')}>
                  <QrCode size={20} strokeWidth={1.6} />
                </IconBtn>
              </div>
            </div>
          ))}
        </div>
      </div>

      {detail && <AccountDetailSheet account={detail} onClose={() => setDetail(null)} />}
      {qr && <AccountQrSheet account={qr} onClose={() => setQr(null)} />}
      {payment && <NewPaymentSheet onClose={() => setPayment(false)} />}
      <BottomNav />
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        background: 'var(--surface-muted)',
        borderRadius: 'var(--r-sm)',
        padding: 12,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {children}
    </button>
  )
}

function AccountDetailSheet({ account, onClose }: { account: Account; onClose: () => void }) {
  const { t } = useT()
  const holder = useApp((s) => s.holder)
  const showToast = useApp((s) => s.showToast)

  const row = (label: string, value: string, copyable?: boolean) => (
    <div className="row" style={{ alignItems: 'flex-start', marginBottom: 16 }}>
      <span style={{ flex: 1 }}>
        <span className="field__label" style={{ display: 'block' }}>
          {label}
        </span>
        <span style={{ fontSize: 16 }}>{value}</span>
      </span>
      {copyable && (
        <button className="link" onClick={() => showToast(t('copied'))} aria-label={t('copied')}>
          <Copy size={20} strokeWidth={1.7} />
        </button>
      )}
    </div>
  )

  return (
    <Sheet title={t('accountDetailsTitle')} onClose={onClose} tall>
      <div style={{ background: 'var(--surface-muted)', borderRadius: 'var(--r-md)', padding: 20 }}>
        {row(t('accountType'), t(account.kind))}
        {row(t('accountOwner'), holder)}
        {row(t('accountNumber'), account.number, true)}
        {row(t('iban'), account.iban, true)}
        {row(t('bic'), account.bic)}
      </div>
    </Sheet>
  )
}

function AccountQrSheet({ account, onClose }: { account: Account; onClose: () => void }) {
  const { t } = useT()
  return (
    <Sheet title={t('createQr')} onClose={onClose} tall>
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <QrArt seed={account.iban} />
        <p className="muted" style={{ textAlign: 'center', margin: 0, fontSize: 13 }}>
          {account.iban}
        </p>
      </div>
    </Sheet>
  )
}
