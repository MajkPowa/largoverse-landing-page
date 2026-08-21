import type { Lang } from '../i18n'

const W = 26
const H = 18

export function Flag({ lang }: { lang: Lang }) {
  if (lang === 'cs') return <FlagCZ />
  if (lang === 'es') return <FlagES />
  return <FlagGB />
}

function frame(children: React.ReactNode) {
  return (
    <svg width={W} height={H} viewBox="0 0 26 18" aria-hidden style={{ borderRadius: 3, flex: 'none' }}>
      {children}
      <rect x="0.5" y="0.5" width="25" height="17" rx="2.5" fill="none" stroke="rgba(11,32,39,.18)" />
    </svg>
  )
}

function FlagCZ() {
  return frame(
    <>
      <rect width="26" height="9" fill="#fff" />
      <rect y="9" width="26" height="9" fill="#d7141a" />
      <path d="M0 0l13 9L0 18z" fill="#11457e" />
    </>,
  )
}

function FlagGB() {
  return frame(
    <>
      <rect width="26" height="18" fill="#012169" />
      <path d="M0 0l26 18M26 0L0 18" stroke="#fff" strokeWidth="3.6" />
      <path d="M0 0l26 18M26 0L0 18" stroke="#c8102e" strokeWidth="2" />
      <path d="M13 0v18M0 9h26" stroke="#fff" strokeWidth="6" />
      <path d="M13 0v18M0 9h26" stroke="#c8102e" strokeWidth="3.4" />
    </>,
  )
}

function FlagES() {
  return frame(
    <>
      <rect width="26" height="18" fill="#c60b1e" />
      <rect y="4.5" width="26" height="9" fill="#ffc400" />
    </>,
  )
}
