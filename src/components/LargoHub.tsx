import type { ReactNode } from 'react'

/**
 * Střed hlavního menu podle dílu 2 – logo se stromem v bílém kruhu,
 * kolem obvodová grafika, po stranách čtyři akční dlaždice.
 */
export function LargoHub({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}: {
  topLeft: ReactNode
  topRight: ReactNode
  bottomLeft: ReactNode
  bottomRight: ReactNode
}) {
  return (
    <div style={{ position: 'relative', margin: '18px 0 0' }}>
      <CircuitArt />
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1fr 116px 1fr',
          gridTemplateRows: 'auto auto',
          columnGap: 6,
          rowGap: 10,
          alignItems: 'center',
        }}
      >
        {topLeft}
        <div style={{ gridRow: '1 / span 2', gridColumn: 2, display: 'grid', placeItems: 'center' }}>
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: 999,
              background: '#fff',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 2px 18px rgba(11,32,39,.08)',
            }}
          >
            <div className="tree-mark" style={{ width: 72, height: 70 }} />
          </div>
        </div>
        {topRight}
        {bottomLeft}
        {bottomRight}
      </div>
    </div>
  )
}

function CircuitArt() {
  return (
    <svg
      viewBox="0 0 200 170"
      aria-hidden
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 200,
        height: 170,
        pointerEvents: 'none',
      }}
    >
      <g stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="1">
        <path d="M100 8v22M78 14v28M122 14v28M62 26v22M138 26v22" />
        <path d="M30 34h34v26M170 34h-34v26" />
        <path d="M22 96h26M152 96h26" />
        <path d="M36 150h32v-22M164 150h-32v-22" />
        <path d="M100 162v-20M78 156v-22M122 156v-22" />
      </g>
      <g fill="#ffffff">
        <circle cx="30" cy="34" r="5.5" />
        <circle cx="170" cy="34" r="5.5" />
        <circle cx="22" cy="96" r="5.5" />
        <circle cx="178" cy="96" r="5.5" />
        <circle cx="36" cy="150" r="5.5" />
        <circle cx="164" cy="150" r="5.5" />
        <circle cx="100" cy="8" r="4" />
        <circle cx="100" cy="162" r="4" />
      </g>
    </svg>
  )
}
