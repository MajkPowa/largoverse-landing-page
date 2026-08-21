import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useApp } from '../store/useApp'
import { useT } from '../lib/useT'
import { money, number } from '../lib/format'
import { convert, EXCHANGEABLE, type Currency } from '../domain/types'
import { tariffFor } from '../domain/pricing'
import { BottomNav } from '../components/BottomNav'
import { CurrencySelect } from '../components/Amount'
import { Button } from '../components/ui'

export function Exchange() {
  const { t, lang } = useT()
  const exchangeAny = useApp((s) => s.exchangeAny)
  const balanceOf = useApp((s) => s.balanceOf)
  const showToast = useApp((s) => s.showToast)
  // Čte se proto, aby se zůstatek přepočítal hned po provedené směně.
  const wallet = useApp((s) => s.wallet)
  const accounts = useApp((s) => s.accounts)
  void wallet
  void accounts

  const [from, setFrom] = useState<Currency>('VES')
  const [to, setTo] = useState<Currency>('XSGD')
  const [input, setInput] = useState('100')

  const value = Number(input.replace(',', '.')) || 0
  // Sazba se liší podle toho, jestli je některá strana v hyperinflaci.
  const tariff = tariffFor(from, to)
  const rate = convert(1, from, to) * (1 - tariff.spread)
  const result = value * rate
  const fee = tariff.feeCzk > 0 ? convert(tariff.feeCzk, 'CZK', from) : 0
  const available = balanceOf(from)

  const swap = () => {
    setFrom(to)
    setTo(from)
  }

  return (
    <div className="screen">
      <div className="screen__body">
        <h1 className="display-title" style={{ marginBottom: 6 }}>
          {t('exchangeTitle', { from, to })}
        </h1>
        <p className="lead" style={{ marginBottom: 14 }}>
          {t('exchangeLead')}
        </p>

        <div className="card" style={{ padding: '22px 20px' }}>
          <AmountRow
            label={t('youPay')}
            value={input}
            onChange={setInput}
            currency={from}
            onCurrency={setFrom}
            other={to}
            editable
          />

          <div className="row" style={{ margin: '16px 0' }}>
            <span style={{ flex: 1, height: 1, background: 'rgba(11,32,39,.12)' }} />
            <button
              onClick={swap}
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: 'var(--primary)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
              aria-label={t('doExchange')}
            >
              <RefreshCw size={20} strokeWidth={2} />
            </button>
            <span style={{ flex: 1, height: 1, background: 'rgba(11,32,39,.12)' }} />
          </div>

          <AmountRow
            label={t('youGet')}
            value={number(result, lang, to === 'VES' ? 0 : to === 'XSGD' ? 4 : 2)}
            currency={to}
            onCurrency={setTo}
            other={from}
          />
        </div>

        <div style={{ marginTop: 16, display: 'grid', gap: 2 }}>
          <span className="muted">
            {t('exchangeRate', { from, rate: number(rate, lang, rate < 1 ? 5 : 2), to })}
          </span>
          <span className="muted">
            {t('spreadValue', { value: number(tariff.spread * 100, lang, 1) })}
          </span>
          {/* Proč zrovna tahle sazba — ať se prezentující nemusí ptát. */}
          <span className="muted">
            {tariff.key === 'hyper'
              ? t('tariffHyper')
              : t('tariffStandard', { fee: money(fee, from, lang) })}
          </span>
          <span className="muted" style={{ fontSize: 12 }}>
            {t('rateDisclaimer')}
          </span>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <span className="tile__label">{t('availableBalance')}</span>
          <div style={{ fontSize: 21, fontWeight: 600, color: 'var(--primary)' }}>
            {money(available, from, lang)}
          </div>
        </div>
      </div>

      <div className="screen__footer" style={{ paddingBottom: 110 }}>
        <Button
          disabled={value <= 0 || value + fee > available || from === to}
          onClick={() => {
            const ok = exchangeAny(from, to, value)
            showToast(t(ok ? 'exchangeDone' : 'insufficientFunds'))
          }}
        >
          {t('doExchange')}
        </Button>
      </div>

      <BottomNav />
    </div>
  )
}

/** Řádek částky — číslo vlevo, výběr měny vpravo, oba řádky zarovnané stejně. */
function AmountRow({
  label,
  value,
  onChange,
  currency,
  onCurrency,
  other,
  editable,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  currency: Currency
  onCurrency: (c: Currency) => void
  other: Currency
  editable?: boolean
}) {
  return (
    <div>
      <span className="field__label">{label}</span>
      <div className="row" style={{ gap: 10 }}>
        {editable ? (
          <input
            value={value}
            inputMode="decimal"
            onChange={(e) => onChange?.(e.target.value.replace(/[^\d.,]/g, ''))}
            style={{ fontSize: 30, minWidth: 0 }}
          />
        ) : (
          <span style={{ fontSize: 30, flex: 1, minWidth: 0 }}>{value}</span>
        )}
        <CurrencySelect
          value={currency}
          options={EXCHANGEABLE}
          onChange={onCurrency}
          disabledOption={other}
        />
      </div>
    </div>
  )
}
