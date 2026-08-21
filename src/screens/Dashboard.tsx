import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, DollarSign, ShieldCheck, UserRound } from 'lucide-react'
import { useApp } from '../store/useApp'
import { useT } from '../lib/useT'
import { FIAT_CURRENCIES, STABLECOINS } from '../domain/types'
import { Amount } from '../components/Amount'
import { BottomNav } from '../components/BottomNav'
import { LargoHub } from '../components/LargoHub'
import { TxRow } from '../components/TxRow'
import { NewPaymentSheet } from './Payments'
import { useState } from 'react'

export function Dashboard() {
  const { t } = useT()
  const navigate = useNavigate()
  const wallet = useApp((s) => s.wallet)
  const holder = useApp((s) => s.holder)
  const transactions = useApp((s) => s.transactions)
  const notifications = useApp((s) => s.notifications)
  const [paymentOpen, setPaymentOpen] = useState(false)

  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="screen">
      <div className="screen__body" style={{ paddingBottom: 0 }}>
        {/* hlavička */}
        <div className="row" style={{ marginBottom: 18 }}>
          <button
            className="row"
            style={{ gap: 12, flex: 1, textAlign: 'left' }}
            onClick={() => navigate('/app/profile')}
          >
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: 'var(--surface)',
                color: 'var(--primary)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <UserRound size={22} strokeWidth={1.6} />
            </span>
            <span style={{ fontSize: 16 }}>{holder}</span>
          </button>
          <button
            onClick={() => navigate('/app/notifications')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: 'var(--surface)',
              color: 'var(--primary)',
              display: 'grid',
              placeItems: 'center',
              position: 'relative',
            }}
            aria-label={t('notificationsTitle')}
          >
            <Bell size={20} strokeWidth={1.7} />
            {unread > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 7,
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: 'var(--danger)',
                }}
              />
            )}
          </button>
        </div>

        {/* zůstatky */}
        <div className="row" style={{ gap: 12, alignItems: 'stretch' }}>
          <div className="tile">
            <span className="tile__label">{t('walletBalance')}</span>
            <div>
              <Amount value={wallet.ves} currency="VES" options={FIAT_CURRENCIES} />
            </div>
          </div>
          <div className="tile">
            <span className="tile__label">{t('cryptoBalance')}</span>
            <div>
              <Amount value={wallet.xsgd} currency="XSGD" options={STABLECOINS} />
            </div>
          </div>
        </div>

        {/* hlavní menu */}
        <LargoHub
          topLeft={
            <ActionTile
              label={t('buyCrypto')}
              icon={<XsgdBadge direction="up" />}
              onClick={() => navigate('/app/crypto/buy')}
            />
          }
          topRight={
            <ActionTile
              label={t('receiveCrypto')}
              icon={<XsgdBadge direction="down" />}
              onClick={() => navigate('/app/crypto/receive')}
            />
          }
          bottomLeft={
            <ActionTile
              label={t('safeMoney')}
              icon={<ShieldCheck size={26} strokeWidth={1.6} />}
              onClick={() => navigate('/app/safe')}
            />
          }
          bottomRight={
            <ActionTile
              label={t('sendMoney')}
              icon={<DollarSign size={26} strokeWidth={2} />}
              onClick={() => setPaymentOpen(true)}
            />
          }
        />

        {/* transakce */}
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--r-lg) var(--r-lg) 0 0',
            margin: '18px -20px 0',
            padding: '18px 20px 110px',
            minHeight: 240,
          }}
        >
          <div className="row" style={{ marginBottom: 4 }}>
            <h2 className="section-title" style={{ flex: 1, margin: 0 }}>
              {t('transactions')}
            </h2>
            <button
              className="link row"
              style={{ gap: 2 }}
              onClick={() => navigate('/app/transactions/acc-czk')}
            >
              {t('all')}
              <ChevronRight size={18} />
            </button>
          </div>
          {transactions.slice(0, 12).map((tx) => (
            <TxRow key={tx.id} tx={tx} showDate={false} />
          ))}
        </div>
      </div>

      <BottomNav />
      {paymentOpen && <NewPaymentSheet onClose={() => setPaymentOpen(false)} />}
    </div>
  )
}

function ActionTile({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--primary)',
        color: 'var(--primary-ink)',
        borderRadius: 'var(--r-sm)',
        padding: '12px 8px 10px',
        display: 'grid',
        placeItems: 'center',
        gap: 4,
        minHeight: 76,
        width: '100%',
      }}
    >
      {icon}
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
    </button>
  )
}

function XsgdBadge({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.6" />
      {direction === 'up' ? (
        <path
          d="M16 20V10m0 0-4 4m4-4 4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M16 10v10m0 0-4-4m4 4 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <text
        x="16"
        y="26.5"
        textAnchor="middle"
        fontSize="6.4"
        fontWeight="700"
        fill="currentColor"
        letterSpacing="0.3"
      >
        XSGD
      </text>
    </svg>
  )
}

export function UploadGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M12 15V4m0 0L8 8m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" />
    </svg>
  )
}
