import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Banknote, CalendarDays, ReceiptText, Search } from 'lucide-react'
import { useApp } from '../store/useApp'
import { useT } from '../lib/useT'
import { groupByMonth, money, monthLabel, shortDate } from '../lib/format'
import { Button, Chip, Field, Sheet, TopBar } from '../components/ui'
import { TxRow } from '../components/TxRow'

export function TransactionList() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const { accountId = 'acc-czk' } = useParams()
  const transactions = useApp((s) => s.transactions)

  const rows = transactions.filter((tx) => tx.accountId === accountId)
  const groups = groupByMonth(rows)

  return (
    <div className="screen">
      <TopBar
        title={t('txListTitle')}
        onBack={() => navigate(-1)}
        right={
          <button
            onClick={() => navigate(`/app/search/${accountId}`)}
            aria-label={t('searchTx')}
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--r-sm)',
              background: 'var(--surface-muted)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Search size={20} strokeWidth={1.8} />
          </button>
        }
      />
      <div className="screen__body">
        {groups.map(([month, items]) => (
          <section key={month}>
            <h3 className="muted" style={{ fontWeight: 400, fontSize: 15, margin: '14px 0 4px' }}>
              {monthLabel(`${month}-01`, lang)}
            </h3>
            {items.map((tx) => (
              <TxRow key={tx.id} tx={tx} />
            ))}
          </section>
        ))}
        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}

type Filters = {
  amount: number | null
  from: string
  to: string
  direction: 'in' | 'out' | null
}

export function SearchTransactions() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const { accountId = 'acc-czk' } = useParams()
  const transactions = useApp((s) => s.transactions)

  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>({ amount: null, from: '', to: '', direction: null })
  const [sheet, setSheet] = useState<'amount' | 'date' | null>(null)

  const active =
    filters.amount !== null || filters.from !== '' || filters.direction !== null || query !== ''

  const results = useMemo(() => {
    return transactions
      .filter((tx) => tx.accountId === accountId)
      .filter((tx) => (query ? tx.title.toLowerCase().includes(query.toLowerCase()) : true))
      .filter((tx) => (filters.amount === null ? true : Math.abs(tx.amount) === filters.amount))
      .filter((tx) => (filters.from ? tx.date >= filters.from : true))
      .filter((tx) => (filters.to ? tx.date <= filters.to : true))
      .filter((tx) =>
        filters.direction === null
          ? true
          : filters.direction === 'in'
            ? tx.amount > 0
            : tx.amount < 0,
      )
  }, [transactions, accountId, query, filters])

  const groups = groupByMonth(results)

  const SUGGESTIONS = [
    'yesterday',
    'thisWeek',
    'lastWeek',
    'thisMonth',
    'lastMonth',
    'thisYear',
    'lastYear',
  ] as const

  return (
    <div className="screen">
      <TopBar title={t('searchTx')} onBack={() => navigate(-1)} />
      <div className="screen__body">
        <Field
          muted
          icon={<Search size={20} strokeWidth={1.8} />}
          value={query}
          onChange={setQuery}
          placeholder={t('searchOnAccount')}
        />

        <div className="chips" style={{ margin: '14px 0 6px' }}>
          <Chip
            label={filters.amount !== null ? money(filters.amount, 'CZK', lang) : t('amount')}
            active={filters.amount !== null}
            onClick={() => setSheet('amount')}
            onRemove={filters.amount !== null ? () => setFilters({ ...filters, amount: null }) : undefined}
          />
          <Chip
            label={
              filters.from
                ? `${shortDate(filters.from, lang)}${filters.to ? ` – ${shortDate(filters.to, lang)}` : ''}`
                : t('date')
            }
            active={!!filters.from}
            onClick={() => setSheet('date')}
            onRemove={filters.from ? () => setFilters({ ...filters, from: '', to: '' }) : undefined}
          />
          <Chip
            label={t('incoming')}
            active={filters.direction === 'in'}
            onClick={() =>
              setFilters({ ...filters, direction: filters.direction === 'in' ? null : 'in' })
            }
          />
          <Chip
            label={t('outgoing')}
            active={filters.direction === 'out'}
            onClick={() =>
              setFilters({ ...filters, direction: filters.direction === 'out' ? null : 'out' })
            }
          />
        </div>

        {!active && (
          <>
            <h3 className="section-title" style={{ fontSize: 17, margin: '30px 0 10px' }}>
              {t('searchSuggestions')}
            </h3>
            <div className="chips" style={{ flexWrap: 'wrap', overflow: 'visible', gap: 8 }}>
              {SUGGESTIONS.map((s) => (
                <Chip key={s} label={t(s)} onClick={() => setFilters({ ...filters, ...rangeFor(s) })} />
              ))}
            </div>
          </>
        )}

        {active && results.length === 0 && (
          <div style={{ display: 'grid', placeItems: 'center', gap: 14, marginTop: 90 }}>
            <ReceiptText size={44} strokeWidth={1.4} style={{ color: 'var(--primary)' }} />
            <span className="muted">{t('noTx')}</span>
          </div>
        )}

        {active &&
          groups.map(([month, items]) => (
            <section key={month}>
              <h3 className="muted" style={{ fontWeight: 400, fontSize: 15, margin: '14px 0 4px' }}>
                {monthLabel(`${month}-01`, lang)}
              </h3>
              {items.map((tx) => (
                <TxRow key={tx.id} tx={tx} />
              ))}
            </section>
          ))}
        <div style={{ height: 24 }} />
      </div>

      {sheet === 'amount' && (
        <AmountFilterSheet
          onClose={() => setSheet(null)}
          onApply={(v) => {
            setFilters({ ...filters, amount: v })
            setSheet(null)
          }}
        />
      )}
      {sheet === 'date' && (
        <DateFilterSheet
          onClose={() => setSheet(null)}
          onApply={(from, to) => {
            setFilters({ ...filters, from, to })
            setSheet(null)
          }}
        />
      )}
    </div>
  )
}

function rangeFor(key: string): { from: string; to: string } {
  const now = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const start = new Date(now)
  const end = new Date(now)

  switch (key) {
    case 'yesterday':
      start.setDate(now.getDate() - 1)
      end.setDate(now.getDate() - 1)
      break
    case 'thisWeek':
      start.setDate(now.getDate() - ((now.getDay() + 6) % 7))
      break
    case 'lastWeek':
      start.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7)
      end.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 1)
      break
    case 'thisMonth':
      start.setDate(1)
      break
    case 'lastMonth':
      start.setMonth(now.getMonth() - 1, 1)
      end.setDate(0)
      break
    case 'thisYear':
      start.setMonth(0, 1)
      break
    case 'lastYear':
      start.setFullYear(now.getFullYear() - 1, 0, 1)
      end.setFullYear(now.getFullYear() - 1, 11, 31)
      break
  }
  return { from: iso(start), to: iso(end) }
}

function AmountFilterSheet({
  onClose,
  onApply,
}: {
  onClose: () => void
  onApply: (v: number | null) => void
}) {
  const { t } = useT()
  const [value, setValue] = useState('')
  return (
    <Sheet
      title={t('amount')}
      onClose={onClose}
      tall
      footer={
        <Button disabled={!value} onClick={() => onApply(Number(value.replace(',', '.')) || null)}>
          {t('show')}
        </Button>
      }
    >
      <Field
        muted
        icon={<Banknote size={20} strokeWidth={1.7} />}
        value={value}
        onChange={setValue}
        placeholder={t('amountOrRange')}
      />
    </Sheet>
  )
}

function DateFilterSheet({
  onClose,
  onApply,
}: {
  onClose: () => void
  onApply: (from: string, to: string) => void
}) {
  const { t, lang } = useT()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [picking, setPicking] = useState<'from' | 'to' | null>('from')
  const [cursor, setCursor] = useState(() => new Date())

  const pick = (iso: string) => {
    if (picking === 'from') {
      setFrom(iso)
      setPicking('to')
    } else {
      setTo(iso)
      setPicking(null)
    }
  }

  return (
    <Sheet
      title={t('date')}
      onClose={onClose}
      tall
      footer={
        <Button disabled={!from} onClick={() => onApply(from, to || from)}>
          {t('show')}
        </Button>
      }
    >
      <div className="field-group">
        <div className="field field--icon" onClick={() => setPicking('from')}>
          <span className="field__icon">
            <CalendarDays size={20} strokeWidth={1.7} />
          </span>
          <span style={{ color: from ? 'var(--text)' : 'var(--text-faint)' }}>
            {from ? shortDate(from, lang) : t('from')}
          </span>
        </div>
        {picking === 'from' && <Calendar cursor={cursor} setCursor={setCursor} selected={from} onPick={pick} />}
        <div className="field field--icon" onClick={() => setPicking('to')}>
          <span className="field__icon">
            <CalendarDays size={20} strokeWidth={1.7} />
          </span>
          <span style={{ color: to ? 'var(--text)' : 'var(--text-faint)' }}>
            {to ? shortDate(to, lang) : t('to')}
          </span>
        </div>
        {picking === 'to' && <Calendar cursor={cursor} setCursor={setCursor} selected={to} onPick={pick} />}
      </div>
    </Sheet>
  )
}

function Calendar({
  cursor,
  setCursor,
  selected,
  onPick,
}: {
  cursor: Date
  setCursor: (d: Date) => void
  selected: string
  onPick: (iso: string) => void
}) {
  const { lang } = useT()
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const label = monthLabel(`${year}-${String(month + 1).padStart(2, '0')}-01`, lang)
  const weekdays = ['PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO', 'NE']

  return (
    <div style={{ padding: '4px 16px 16px' }}>
      <div className="row" style={{ marginBottom: 10 }}>
        <span style={{ flex: 1, fontSize: 16 }}>{label}</span>
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="‹">
          ‹
        </button>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} style={{ marginLeft: 16 }} aria-label="›">
          ›
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
        {weekdays.map((w) => (
          <span key={w} className="muted" style={{ fontSize: 12 }}>
            {w}
          </span>
        ))}
        {Array.from({ length: startOffset }, (_, i) => (
          <span key={`e-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isSelected = selected === iso
          return (
            <button
              key={iso}
              onClick={() => onPick(iso)}
              style={{
                height: 32,
                borderRadius: 6,
                background: isSelected ? 'var(--primary)' : 'transparent',
                color: isSelected ? '#fff' : 'var(--text)',
                fontSize: 14,
              }}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
