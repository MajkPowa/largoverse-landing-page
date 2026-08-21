import { retainedIndex } from '../domain/inflation'
import type { Currency } from '../domain/types'

/**
 * Rozevírající se nůžky mezi dvěma měnami za posledních dvanáct měsíců.
 *
 * Kreslí se index kupní síly: obě křivky začínají na 100 a klesají podle
 * ZVEŘEJNĚNÉ roční inflace. Plocha mezi nimi je vyplněná schválně — ten klín
 * je celé sdělení a je vidět dřív, než kdokoli přečte jediné číslo.
 *
 * Průběh mezi krajními body je odvozený z roční míry (rovnoměrné měsíční
 * tempo), protože měsíční řadu pro Venezuelu nikdo nezveřejňuje. Musí to být
 * napsané pod grafem, jinak by to byl dojem vydávaný za měření.
 */
export function ValueChart({
  series,
  months = 12,
  height = 168,
}: {
  series: { code: Currency; annual: number; color: string; planned?: boolean }[]
  months?: number
  height?: number
}) {
  const W = 320
  const PAD_L = 22
  const PAD_R = 78
  const PAD_T = 16
  const PAD_B = 12
  const plotW = W - PAD_L - PAD_R
  const plotH = height - PAD_T - PAD_B

  const x = (t: number) => PAD_L + (plotW * t) / months
  const y = (v: number) => PAD_T + plotH * (1 - v / 100)

  const steps = Array.from({ length: months + 1 }, (_, i) => i)
  const path = (annual: number) => steps.map((t) => [x(t), y(retainedIndex(annual, t, months))])
  const endValue = (annual: number) => retainedIndex(annual, months, months)

  const [a, b] = series
  const wedge =
    a && b
      ? [...path(b.annual), ...path(a.annual).reverse()]
          .map(([px, py]) => `${px},${py}`)
          .join(' ')
      : ''

  const ends = series.map((s) => endValue(s.annual))

  /*
   * Popisky konců se u měn s podobnou inflací překrývají. Seřadí se odshora
   * a každý další se odsune tak, aby mezi nimi zůstala čitelná mezera.
   * Musí to zvládnout libovolný počet křivek, ne jen dvě.
   */
  const MIN_GAP = 15
  const labelY: number[] = []
  ends
    .map((v, i) => ({ i, py: y(v) }))
    .sort((p, q) => p.py - q.py)
    .forEach((item, k, arr) => {
      const prev = k > 0 ? labelY[arr[k - 1].i] : -Infinity
      labelY[item.i] = Math.max(item.py, prev + MIN_GAP)
    })

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} aria-hidden>
      {/* Vodicí linky se popiskem — bez nich není z čeho odhadnout výšku. */}
      {[100, 50, 0].map((v) => (
        <g key={v}>
          <line
            x1={PAD_L}
            x2={PAD_L + plotW}
            y1={y(v)}
            y2={y(v)}
            stroke="rgba(255,255,255,.18)"
            strokeWidth="1"
            strokeDasharray={v === 0 ? undefined : '3 5'}
          />
          <text
            x={PAD_L - 5}
            y={y(v) + 3.4}
            fill="rgba(255,255,255,.5)"
            fontSize="9"
            textAnchor="end"
          >
            {v}
          </text>
        </g>
      ))}

      {/* Klín mezi křivkami — rozdíl v uchování hodnoty jako plocha. */}
      {wedge && <polygon points={wedge} fill="rgba(255,255,255,.17)" />}

      {series.map((s, i) => {
        const pts = path(s.annual)
        const end = ends[i]
        // Plánovaná měna se kreslí čárkovaně a průsvitně — je vidět, že
        // v nabídce zatím není, ale že se s ní počítá.
        const dim = s.planned ? 0.5 : 1
        return (
          <g key={s.code} opacity={dim}>
            <polyline
              points={pts.map(([px, py]) => `${px},${py}`).join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth={s.planned ? 2.2 : 3.2}
              strokeDasharray={s.planned ? '5 4' : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx={x(months)} cy={y(end)} r={s.planned ? 3.2 : 4.4} fill={s.color} />
            {/* Hodnota a kód na jednom řádku — u měn s podobnou inflací by se
                dva řádky popisků přetiskly přes sebe. */}
            <text
              x={x(months) + 9}
              y={labelY[i] + 4}
              fill={s.color}
              fontSize={s.planned ? 13 : 16}
              fontWeight="700"
            >
              {Math.round(end)} %
              <tspan fontSize="10" fontWeight="600" dx="4" opacity="0.85">
                {s.code}
              </tspan>
            </text>
          </g>
        )
      })}

      {/* Společný začátek — obojí odsud padá, ať je vidět, že start byl stejný. */}
      <circle cx={x(0)} cy={y(100)} r="3.4" fill="#ffffff" />
    </svg>
  )
}
