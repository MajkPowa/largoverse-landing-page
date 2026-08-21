import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeftRight, CreditCard, LayoutGrid, ReceiptText, Wallet } from 'lucide-react'
import { useT } from '../lib/useT'

const ITEMS = [
  { to: '/app', icon: LayoutGrid, key: 'navOverview' },
  { to: '/app/cards', icon: CreditCard, key: 'navCards' },
  { to: '/app/accounts', icon: ReceiptText, key: 'navAccounts' },
  { to: '/app/exchange', icon: ArrowLeftRight, key: 'navExchange' },
  { to: '/app/wallet', icon: Wallet, key: 'navWallet' },
] as const

export function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useT()

  return (
    <nav className="bottomnav">
      {ITEMS.map(({ to, icon: Icon, key }) => {
        const active = to === '/app' ? pathname === '/app' : pathname.startsWith(to)
        return (
          <button
            key={to}
            className={`bottomnav__item${active ? ' bottomnav__item--active' : ''}`}
            onClick={() => navigate(to)}
            aria-label={t(key)}
          >
            <Icon size={24} strokeWidth={1.7} />
          </button>
        )
      })}
    </nav>
  )
}
