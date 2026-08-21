import { useEffect, useRef, useState } from 'react'
import largoTree from './assets/largo-tree.png'
import { PulsingTreeVideo } from './components/PulsingTreeVideo'

const panels = {
  about: {
    index: '01',
    label: 'O nás',
    eyebrow: 'Vize LargoVerse',
    title: 'Finance jako živý ekosystém.',
    description:
      'Propojujeme každodenní finance, digitální aktiva a bezpečnou identitu do jednoho přehledného prostředí.',
    points: ['Jedno místo pro celý finanční život', 'Jednoduchost bez ztráty kontroly', 'Technologie postavená pro další generaci'],
    action: 'Poznat možnosti',
    next: 'features',
    position: 'portal-link--about',
  },
  access: {
    index: '02',
    label: 'Vstoupit',
    eyebrow: 'Soukromý přístup',
    title: 'Vaše brána do LargoVerse.',
    description:
      'Beta prostředí je připravené pro bezpečné představení produktu partnerům a pozvaným uživatelům.',
    points: ['Chráněný přístup', 'Interaktivní produktová ukázka', 'Čeština, angličtina a španělština'],
    action: 'Zjistit, jak začít',
    next: 'start',
    position: 'portal-link--access',
  },
  features: {
    index: '03',
    label: 'Možnosti',
    eyebrow: 'Jeden propojený svět',
    title: 'Všechno důležité roste z jednoho místa.',
    description:
      'Modulární základ dává každé funkci vlastní větev, přitom zachovává jediný, srozumitelný celek.',
    points: ['Multiměnové účty a platby', 'Digitální aktiva a chytrá směna', 'Karty, identita a bezpečný trezor'],
    action: 'Jak začít',
    next: 'start',
    position: 'portal-link--features',
  },
  start: {
    index: '04',
    label: 'Začít',
    eyebrow: 'První krok',
    title: 'Od myšlenky k vlastnímu finančnímu prostoru.',
    description:
      'Projděte si jednotlivé větve, poznejte logiku produktu a otevřete si cestu k uzavřené beta ukázce.',
    points: ['Prozkoumejte klíčové funkce', 'Vyberte si svůj způsob používání', 'Plynule pokračujte do beta prostředí'],
    action: 'Otevřít vstup',
    next: 'access',
    position: 'portal-link--start',
  },
  investors: {
    index: '05',
    label: 'Pro investory',
    eyebrow: 'Růst a partnerství',
    title: 'Infrastruktura pro novou finanční ekonomiku.',
    description:
      'LargoVerse staví společnou vrstvu pro fiat měny, digitální aktiva a ověřenou identitu uživatele.',
    points: ['Škálovatelný modulární produkt', 'Jasná ukázka uživatelské hodnoty', 'Připraveno pro partnerský ekosystém'],
    action: 'Vstoupit do ukázky',
    next: 'access',
    position: 'portal-link--investors',
  },
} as const

type PanelId = keyof typeof panels

const panelOrder = Object.keys(panels) as PanelId[]

export default function App() {
  const [activeId, setActiveId] = useState<PanelId | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLButtonElement | null>(null)
  const activePanel = activeId ? panels[activeId] : null

  const openPanel = (id: PanelId, trigger?: HTMLButtonElement) => {
    if (trigger) previousFocusRef.current = trigger
    setActiveId(id)
  }

  const closePanel = () => {
    setActiveId(null)
    window.requestAnimationFrame(() => previousFocusRef.current?.focus())
  }

  useEffect(() => {
    if (!activeId) return

    closeRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closePanel()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => !element.hasAttribute('disabled'))
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeId])

  return (
    <main className={`portal-shell${activeId ? ' portal-shell--open' : ''}`}>
      <div className="portal-noise" aria-hidden="true" />
      <div className="portal-grid" aria-hidden="true" />

      <div className="portal-scene">
        <header className="portal-brand" aria-label="LargoVerse">
          <img src={largoTree} alt="" className="portal-brand__mark" />
          <div className="portal-brand__name">LargoVerse</div>
          <div className="portal-brand__line" />
        </header>

        <div className="tree-field" aria-hidden="true">
          <div className="tree-field__aura" />
          <PulsingTreeVideo />
        </div>

        <nav className="portal-nav" aria-label="Hlavní rozcestník" aria-hidden={activeId ? 'true' : undefined}>
          {panelOrder.map((id) => {
            const panel = panels[id]
            return (
              <button
                className={`portal-link ${panel.position}${activeId === id ? ' portal-link--active' : ''}`}
                type="button"
                key={id}
                aria-haspopup="dialog"
                aria-expanded={activeId === id}
                tabIndex={activeId ? -1 : 0}
                onClick={(event) => openPanel(id, event.currentTarget)}
              >
                <span className="portal-link__index">{panel.index}</span>
                <span>{panel.label}</span>
                <span className="portal-link__signal" aria-hidden="true" />
              </button>
            )
          })}
        </nav>
      </div>

      <div className="portal-status" aria-hidden="true">
        <span className="portal-status__dot" />
        Síť aktivní
      </div>
      <p className="portal-caption">Finance, které rostou s vámi</p>

      {activePanel && activeId && (
        <div
          className="dialog-layer"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closePanel()
          }}
        >
          <div
            className="info-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-description"
            ref={dialogRef}
          >
            <div className="info-dialog__beam" aria-hidden="true" />
            <div className="info-dialog__topline">
              <span className="info-dialog__index">NODE / {activePanel.index}</span>
              <button className="info-dialog__close" type="button" onClick={closePanel} ref={closeRef} aria-label="Zavřít kartu">
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className="info-dialog__content">
              <p className="info-dialog__eyebrow">{activePanel.eyebrow}</p>
              <h1 id="dialog-title">{activePanel.title}</h1>
              <p id="dialog-description" className="info-dialog__description">
                {activePanel.description}
              </p>

              <ul className="info-dialog__points">
                {activePanel.points.map((point) => (
                  <li key={point}>
                    <span aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <button className="info-dialog__action" type="button" onClick={() => openPanel(activePanel.next)}>
              <span>{activePanel.action}</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
