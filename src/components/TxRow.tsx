import type { ReactNode } from 'react'
import {
  ArrowLeftRight,
  Banknote,
  Bus,
  Coins,
  CreditCard,
  Download,
  Percent,
  RefreshCw,
  ShieldCheck,
  ShoppingBasket,
  Upload,
  Utensils,
} from 'lucide-react'
import type { Tx, TxKind } from '../domain/types'
import { useT } from '../lib/useT'
import { money, shortDate } from '../lib/format'
import { ListRow } from './ui'

/** Jedno místo, které rozhoduje, jakou ikonu transakce dostane. */
const ICONS: Record<TxKind, ReactNode> = {
  transfer: <Upload size={20} strokeWidth={1.7} />,
  incoming: <Download size={20} strokeWidth={1.7} />,
  card: <CreditCard size={20} strokeWidth={1.7} />,
  restaurant: <Utensils size={20} strokeWidth={1.7} />,
  groceries: <ShoppingBasket size={20} strokeWidth={1.7} />,
  transport: <Bus size={20} strokeWidth={1.7} />,
  subscription: <RefreshCw size={20} strokeWidth={1.7} />,
  atm: <Banknote size={20} strokeWidth={1.7} />,
  exchange: <ArrowLeftRight size={20} strokeWidth={1.7} />,
  crypto: <Coins size={20} strokeWidth={1.7} />,
  vault: <ShieldCheck size={20} strokeWidth={1.7} />,
  fee: <Percent size={20} strokeWidth={1.7} />,
}

export function txIcon(kind: TxKind): ReactNode {
  return ICONS[kind] ?? ICONS.transfer
}

/**
 * Řádek historie. Pod částkou je vždy datum — v návrhu je na přehledu zástupné
 * slovo „Title", ale s reálnými daty už není co zastupovat.
 */
export function TxRow({ tx, showDate = true }: { tx: Tx; showDate?: boolean }) {
  const { t, lang } = useT()
  return (
    <ListRow
      squareIcon={showDate}
      icon={txIcon(tx.kind)}
      title={tx.title}
      subtitle={tx.note ?? t(tx.subtitleKey)}
      right={money(tx.amount, tx.currency, lang, true)}
      rightSub={shortDate(tx.date, lang)}
    />
  )
}
