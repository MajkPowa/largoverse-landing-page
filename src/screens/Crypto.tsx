import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Copy, ShieldCheck, Share2 } from 'lucide-react'
import { useApp } from '../store/useApp'
import { useT } from '../lib/useT'
import { money, number } from '../lib/format'
import { convert, EXCHANGEABLE, STABLECOINS, type Currency } from '../domain/types'
import { tariffFor } from '../domain/pricing'
import {
  anchorRetained,
  coreRetained,
  currencyRetained,
  INFLATION,
  MEANINGFUL_RATIO,
  mostAffectedCurrency,
  periodLabel,
  inflationGapPoints,
  retainedValue,
  retentionRatio,
  SGD_CORE,
  XSGD_ANCHOR,
} from '../domain/inflation'
import { WALLET_ADDRESS } from '../domain/seed'
import { BottomNav } from '../components/BottomNav'
import { Button, Field, TopBar } from '../components/ui'
import { Amount, CurrencySelect } from '../components/Amount'
import { ReorderList } from '../components/ReorderList'
import { ValueChart } from '../components/ValueChart'
import { TxRow } from '../components/TxRow'
import { QrArt } from './Payments'

/* ------------------------------------------------------------- nákup XSGD */

export function BuyCrypto() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const exchangeAny = useApp((s) => s.exchangeAny)
  const balanceOf = useApp((s) => s.balanceOf)
  const wallet = useApp((s) => s.wallet)
  const accounts = useApp((s) => s.accounts)
  const showToast = useApp((s) => s.showToast)
  const [input, setInput] = useState('1000')
  const [from, setFrom] = useState<Currency>('VES')
  const [to, setTo] = useState<Currency>('XSGD')

  // wallet a accounts se čtou proto, aby se zůstatek přepočítal po směně.
  void wallet
  void accounts

  const tariff = tariffFor(from, to)
  const rate = convert(1, from, to) * (1 - tariff.spread)
  const value = Number(input.replace(',', '.')) || 0
  const gained = value * rate
  const fee = tariff.feeCzk > 0 ? convert(tariff.feeCzk, 'CZK', from) : 0
  const available = balanceOf(from)

  return (
    <div className="screen">
      <TopBar title={t('buyCryptoTitle', { token: to })} onBack={() => navigate('/app')} />
      <div className="screen__body">
        <p className="lead">{t('buyCryptoLead')}</p>

        <div className="card" style={{ display: 'grid', gap: 18 }}>
          <div>
            <span className="field__label">{t('youPay')}</span>
            <div className="row" style={{ gap: 10 }}>
              <input
                value={input}
                inputMode="decimal"
                onChange={(e) => setInput(e.target.value.replace(/[^\d.,]/g, ''))}
                style={{ fontSize: 28, minWidth: 0 }}
              />
              <CurrencySelect
                value={from}
                options={EXCHANGEABLE.filter((c) => !STABLECOINS.includes(c))}
                onChange={setFrom}
              />
            </div>
          </div>
          <div style={{ height: 1, background: 'rgba(11,32,39,.1)' }} />
          <div>
            <span className="field__label">{t('youGet')}</span>
            <div className="row" style={{ gap: 10 }}>
              <span style={{ fontSize: 28, flex: 1, minWidth: 0 }}>{number(gained, lang, 4)}</span>
              {/* Jen stablecoiny, které klient reálně drží — jinak by se
                  nabízela měna, kam nemá co přijít. */}
              <CurrencySelect
                value={to}
                options={STABLECOINS.filter((c) => EXCHANGEABLE.includes(c))}
                onChange={setTo}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'grid', gap: 2 }}>
          <span className="muted">
            {t('exchangeRate', { from, rate: number(rate, lang, rate < 1 ? 5 : 2), to })}
          </span>
          <span className="muted">
            {t('spreadValue', { value: number(tariff.spread * 100, lang, 1) })}
          </span>
          <span className="muted">
            {tariff.key === 'hyper'
              ? t('tariffHyper')
              : t('tariffStandard', { fee: money(fee, from, lang) })}
          </span>
          <span className="muted" style={{ fontSize: 12 }}>
            {t('rateDisclaimer')}
          </span>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <span className="tile__label">{t('availableBalance')}</span>
          <div style={{ fontSize: 21, fontWeight: 600, color: 'var(--primary)' }}>
            {money(available, from, lang)}
          </div>
        </div>
      </div>
      <div className="screen__footer">
        <Button
          disabled={value <= 0 || value + fee > available}
          onClick={() => {
            const ok = exchangeAny(from, to, value)
            showToast(t(ok ? 'bought' : 'insufficientFunds'))
            if (ok) navigate('/app')
          }}
        >
          {t('buyNow')}
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ příjem XSGD */

export function ReceiveCrypto() {
  const { t } = useT()
  const navigate = useNavigate()
  const wallet = useApp((s) => s.wallet)
  const showToast = useApp((s) => s.showToast)

  return (
    <div className="screen">
      <TopBar title={t('receiveCryptoTitle')} onBack={() => navigate('/app')} />
      <div className="screen__body">
        <p className="lead">{t('receiveCryptoLead')}</p>

        <div className="card" style={{ display: 'grid', gap: 16 }}>
          <QrArt seed={WALLET_ADDRESS} size={210} />
          <div>
            <span className="field__label">{t('walletAddress')}</span>
            <div className="row">
              <span style={{ flex: 1, fontSize: 14, letterSpacing: '0.02em' }}>{WALLET_ADDRESS}</span>
              <button className="link" onClick={() => showToast(t('copied'))} aria-label={t('copyAddress')}>
                <Copy size={20} strokeWidth={1.7} />
              </button>
            </div>
          </div>
          <div>
            <span className="field__label">{t('network')}</span>
            <div>XSGD · Polygon</div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <span className="tile__label">{t('cryptoBalance')}</span>
          <div><Amount value={wallet.xsgd} currency="XSGD" /></div>
        </div>
      </div>
      <div className="screen__footer">
        <Button icon={<Share2 size={18} />} onClick={() => showToast(t('shareQr'))}>
          {t('shareQr')}
        </Button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- safe money */

export function SafeMoney() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const wallet = useApp((s) => s.wallet)
  const accounts = useApp((s) => s.accounts)
  const balanceOf = useApp((s) => s.balanceOf)
  const vaultMove = useApp((s) => s.vaultMove)
  const showToast = useApp((s) => s.showToast)
  const [amount, setAmount] = useState('1000')

  /*
   * Safe Money je zásadně vedené v XSGD. Není to volba uživatele — je to celý
   * smysl funkce: XSGD má proti ostatním tokenům likviditu, je vázaný na
   * singapurský dolar a přes něj na stát s ratingem AAA. Trezor po měnách
   * („vlož bolívary, drž bolívary") by proti devalvaci nechránil před ničím.
   */
  const VAULT: Currency = 'XSGD'

  /**
   * Měna, ze které klient odkládá. Otevírá se rovnou na té, u které má
   * uchování hodnoty nejsilnější důvod, ať se prezentující nemusí proklikávat.
   */
  const [source, setSource] = useState<Currency>(
    () => mostAffectedCurrency(EXCHANGEABLE.filter((c) => c !== VAULT)) ?? 'VES',
  )
  const [detailsOpen, setDetailsOpen] = useState(false)
  void accounts

  const value = Number(amount.replace(',', '.')) || 0
  const inVault = wallet.vaults[VAULT] ?? 0
  const free = balanceOf(source)

  // Vklad z jiné měny je zároveň směna, proto stejná sazba jako u směny.
  const cross = source !== VAULT
  const spread = cross ? tariffFor(source, VAULT).spread : 0
  const converted = cross ? convert(value, source, VAULT) * (1 - spread) : value

  // Srovnává se měna, ze které klient odkládá, proti kotvě XSGD.
  const point = INFLATION[source]
  const kept = currencyRetained(source)
  const anchorKept = anchorRetained()
  const ratio = retentionRatio(source)
  const points = inflationGapPoints(source)
  /** USDT sleduje dolar — do grafu se kreslí z americké inflace. */
  const usdPoint = INFLATION.USD
  const meaningful = ratio !== null && ratio >= MEANINGFUL_RATIO

  const run = (direction: 'in' | 'out') => {
    const ok = vaultMove(VAULT, value, direction, source)
    showToast(t(ok ? 'moved' : 'insufficientFunds'))
  }

  return (
    <div className="screen">
      <TopBar title={t('safeMoneyTitle')} onBack={() => navigate('/app')} />
      <div className="screen__body">
        <p className="lead">{t('safeMoneyLead')}</p>

        <div
          className="card"
          style={{
            background: `linear-gradient(120deg, var(--card-from), var(--card-to))`,
            color: '#fff',
            display: 'grid',
            gap: 6,
            padding: '22px 20px',
          }}
        >
          <span className="row" style={{ gap: 8, opacity: 0.85, fontSize: 14 }}>
            <ShieldCheck size={18} strokeWidth={1.7} />
            {t('vaultBalance')}
          </span>
          <div style={{ fontSize: 30, fontWeight: 600 }}>{money(inVault, VAULT, lang)}</div>

          {/*
            Uchování hodnoty, ne výnos. Je to tentýž fakt jako dřívější procentní
            rozdíl, jen řečený jako „kolik zůstalo" — doložitelné zveřejněnou
            inflací a bez slibu, který by spadal pod čl. 50 MiCA. Zdroje
            a jádrová inflace jsou pod rozbalovátkem, ať karta nekřičí.
          */}
          {!point || kept === null ? (
            <span style={{ opacity: 0.8, fontSize: 12 }}>{t('keepUnknown', { cur: source })}</span>
          ) : (
            <div style={{ display: 'grid', gap: 4, marginTop: 4 }}>
              <span style={{ opacity: 0.8, fontSize: 12 }}>{t('keepTitle')}</span>

              {/* Graf mluví sám: jedna křivka padá, druhá ne. Číslo pod ním je
                  veřejná statistika (rozdíl dvou zveřejněných měr), ne tvrzení
                  o produktu — procentní bod není jednotka zhodnocení. */}
              <ValueChart
                series={[
                  { code: source, annual: point.annual, color: '#ff9f8a' },
                  { code: VAULT, annual: XSGD_ANCHOR.annual, color: '#8fe3c4' },
                  // USDT je vázaný na dolar, takže jeho kupní sílu určuje
                  // americká inflace. V nabídce zatím není — proto průsvitně.
                  ...(usdPoint && source !== 'USD'
                    ? [
                        {
                          code: 'USDT' as Currency,
                          annual: usdPoint.annual,
                          color: '#cfe0e7',
                          planned: true,
                        },
                      ]
                    : []),
                ]}
              />
              <div className="row" style={{ opacity: 0.75, fontSize: 10.5, marginTop: -4 }}>
                <span style={{ flex: 1 }}>{t('keepChartStart')}</span>
                <span>{t('keepChartNow')}</span>
              </div>

              <span style={{ opacity: 0.92, fontSize: 12.5, lineHeight: 1.45, marginTop: 2 }}>
                {t('keepDetail', {
                  cur: source,
                  curVal: number(kept, lang, kept < 10 ? 1 : 0),
                  anchorVal: number(anchorKept, lang, 0),
                })}
              </span>

              {meaningful && points !== null && (
                <span style={{ opacity: 0.8, fontSize: 11, lineHeight: 1.4 }}>
                  {t('keepPoints', {
                    value: number(points, lang, 1),
                    cur: source,
                    curVal: number(point.annual, lang, point.annual > 20 ? 0 : 1),
                    curSrc: `${point.source}, ${periodLabel(point.asOf)}`,
                    anchor: XSGD_ANCHOR.anchorCurrency,
                    anchorVal: number(XSGD_ANCHOR.annual, lang, 1),
                    anchorSrc: periodLabel(XSGD_ANCHOR.asOf),
                  })}
                </span>
              )}
              {!meaningful && (
                <span style={{ opacity: 0.8, fontSize: 11, lineHeight: 1.4 }}>
                  {t('keepTooSmall', { cur: source })}
                </span>
              )}


              <button
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="row"
                style={{ gap: 4, opacity: 0.75, fontSize: 11, marginTop: 2 }}
              >
                {detailsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {t('ppGapDetails')}
              </button>

              {detailsOpen && (
                <div style={{ display: 'grid', gap: 3, opacity: 0.75, fontSize: 11, lineHeight: 1.4 }}>
                  <span>{t('keepChartNote')}</span>
                  {usdPoint && source !== 'USD' && (
                    <span>
                      {t('keepPlanned', {
                        curVal: number(usdPoint.annual, lang, 1),
                        curSrc: `${usdPoint.source}, ${periodLabel(usdPoint.asOf)}`,
                        keep: number(retainedValue(usdPoint.annual), lang, 1),
                      })}
                    </span>
                  )}
                  <span>
                    {t('ppGapSource', {
                      cur: source,
                      curVal: number(point.annual, lang, point.annual > 20 ? 0 : 1),
                      curSrc: `${point.source}, ${periodLabel(point.asOf)}`,
                      anchor: XSGD_ANCHOR.anchorCurrency,
                      anchorVal: number(XSGD_ANCHOR.annual, lang, 1),
                      anchorSrc: `${XSGD_ANCHOR.source}, ${periodLabel(XSGD_ANCHOR.asOf)}`,
                    })}
                    {point.altAnnual
                      ? ` · ${t('ppGapAlt', { alt: number(point.altAnnual, lang, 0), altSrc: point.altSource ?? '' })}`
                      : ''}
                  </span>
                  {/* Jádrová inflace patří bankám, ne peněžence — je tu jako
                      kontext a teď i s vlastním číslem, ne jen zmínkou. */}
                  <span>
                    {t('keepCore', {
                      anchor: XSGD_ANCHOR.anchorCurrency,
                      coreVal: number(SGD_CORE.annual, lang, 1),
                      coreExcludes: t('sgdCoreExcludes'),
                      coreKeep: number(coreRetained(), lang, 1),
                    })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="stack" style={{ marginTop: 18 }}>
          <div className="row" style={{ gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Field label={t('amount')} value={amount} onChange={setAmount} muted />
            </div>
            {/* Měna, ze které se odkládá. Safe Money samo je vždycky v XSGD,
                takže vklad z jiné měny je po cestě směna se spreadem. */}
            <CurrencySelect value={source} options={EXCHANGEABLE} onChange={setSource} />
          </div>
          {cross && value > 0 && (
            <span className="muted" style={{ fontSize: 12 }}>
              {t('vaultConverts', {
                value: money(converted, VAULT, lang),
                spread: number(spread * 100, lang, 1),
              })}
            </span>
          )}
          <div className="btn-row">
            <Button variant="secondary" onClick={() => run('out')}>
              {t('takeFromVault')}
            </Button>
            <Button onClick={() => run('in')}>{t('addToVault')}</Button>
          </div>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <span className="tile__label">{t('availableBalance')}</span>
          <div style={{ fontSize: 21, fontWeight: 600, color: 'var(--primary)' }}>
            {money(free, source, lang)}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- wallet */

export function WalletScreen() {
  const { t, lang } = useT()
  const wallet = useApp((s) => s.wallet)
  const accounts = useApp((s) => s.accounts)
  const transactions = useApp((s) => s.transactions)
  const assetOrder = useApp((s) => s.assetOrder)
  const reorderAssets = useApp((s) => s.reorderAssets)

  const walletHistory = transactions.filter((tx) => tx.accountId === 'wallet').slice(0, 15)

  const byId: Record<string, { label: string; amount: number; currency: Currency }> = {
    ...Object.fromEntries(
      accounts.map((a) => [a.id, { label: t(a.kind), amount: a.balance, currency: a.currency }]),
    ),
    'wallet-ves': { label: t('walletBalance'), amount: wallet.ves, currency: 'VES' },
    'wallet-xsgd': { label: t('cryptoBalance'), amount: wallet.xsgd, currency: 'XSGD' },
    // Safe Money je vedené v XSGD, ale řádek se skládá z mapy — kdyby se
    // někdy vrátilo víc měn, seznam se přizpůsobí sám.
    ...Object.fromEntries(
      Object.entries(wallet.vaults)
        .filter(([, amount]) => (amount ?? 0) > 0)
        .map(([c, amount]) => [
          `vault-${c}`,
          { label: t('safeMoney'), amount: amount ?? 0, currency: c as Currency },
        ]),
    ),
  }

  // Pořadí si drží uživatel; cokoli nového se přidá na konec, ať nic nezmizí.
  const ids = [
    ...assetOrder.filter((id: string) => byId[id]),
    ...Object.keys(byId).filter((id) => !assetOrder.includes(id)),
  ]

  const total = ids.reduce((sum, id) => sum + convert(byId[id].amount, byId[id].currency, 'CZK'), 0)

  return (
    <div className="screen">
      <TopBar title={t('walletTitle')} center />
      <div className="screen__body">
        <div
          className="card"
          style={{
            background: `linear-gradient(120deg, var(--card-from), var(--card-to))`,
            color: '#fff',
            padding: '22px 20px',
            marginBottom: 18,
          }}
        >
          <span style={{ opacity: 0.85, fontSize: 14 }}>{t('totalValue')}</span>
          <Amount value={total} currency="CZK" size="lg" light />
        </div>

        <h2 className="section-title" style={{ fontSize: 17 }}>
          {t('assets')}
        </h2>
        {/* V aktivech se měna nepřepíná — každá položka je ve své vlastní.
            Místo toho jdou řádky přetáhnout za úchyt vlevo. */}
        <ReorderList
          ids={ids}
          onReorder={reorderAssets}
          renderRow={(id) => (
            <>
              <span style={{ flex: 1, minWidth: 0 }}>{byId[id].label}</span>
              <strong style={{ whiteSpace: 'nowrap' }}>
                {money(byId[id].amount, byId[id].currency, lang)}
              </strong>
            </>
          )}
        />

        {/* Pohyby v peněžence — směna, nákup crypta, Safe Money. */}
        <h2 className="section-title" style={{ fontSize: 17, marginTop: 22 }}>
          {t('walletActivity')}
        </h2>
        <div style={{ paddingBottom: 110 }}>
          {walletHistory.length === 0 ? (
            <p className="muted" style={{ marginTop: 4 }}>
              {t('noWalletActivity')}
            </p>
          ) : (
            walletHistory.map((tx) => <TxRow key={tx.id} tx={tx} />)
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
