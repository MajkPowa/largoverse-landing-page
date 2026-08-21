import { useRef, useState, type ReactNode } from 'react'
import { GripVertical } from 'lucide-react'

/**
 * Seznam, ve kterém jde řádky přetahovat.
 *
 * Postavené na Pointer Events, ne na HTML5 drag-and-drop — ten na dotykových
 * displejích nefunguje a ukázka se pouští hlavně na telefonu. Táhne se za
 * úchyt, ne za celý řádek, aby šlo seznamem pořád normálně scrollovat.
 */
export function ReorderList({
  ids,
  onReorder,
  renderRow,
  gap = 12,
}: {
  ids: string[]
  onReorder: (ids: string[]) => void
  renderRow: (id: string) => ReactNode
  gap?: number
}) {
  const [drag, setDrag] = useState<{ from: number; dy: number } | null>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])

  /** Výška řádku i s mezerou — měří se z reálného prvku, ne odhadem. */
  const step = () => {
    const el = rowRefs.current.find(Boolean)
    return el ? el.getBoundingClientRect().height + gap : 60
  }

  /** Kam by řádek spadl, kdyby ho uživatel právě pustil. */
  const projected = drag
    ? Math.min(ids.length - 1, Math.max(0, drag.from + Math.round(drag.dy / step())))
    : null

  /** Táhne se jen jedním prstem — druhý dotyk se ignoruje. */
  const activePointer = useRef<number | null>(null)

  const start = (e: React.PointerEvent, index: number) => {
    if (activePointer.current !== null) return
    e.preventDefault()
    activePointer.current = e.pointerId
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    setDrag({ from: index, dy: 0 })
  }

  const move = (e: React.PointerEvent, startY: number) => {
    if (!drag || e.pointerId !== activePointer.current) return
    setDrag({ ...drag, dy: e.clientY - startY })
  }

  const end = (e?: React.PointerEvent) => {
    if (e && e.pointerId !== activePointer.current) return
    if (drag && projected !== null && projected !== drag.from) {
      const next = [...ids]
      const [moved] = next.splice(drag.from, 1)
      next.splice(projected, 0, moved)
      onReorder(next)
    }
    activePointer.current = null
    setDrag(null)
  }

  /** Zrušené tažení (příchozí hovor, gesto systému) pořadí NEMĚNÍ. */
  const cancel = () => {
    activePointer.current = null
    setDrag(null)
  }

  return (
    <div style={{ display: 'grid', gap }}>
      {ids.map((id, i) => {
        const isDragged = drag?.from === i
        // Ostatní řádky uhýbají, aby bylo vidět, kam to spadne.
        let shift = 0
        if (drag && projected !== null && !isDragged) {
          if (drag.from < projected && i > drag.from && i <= projected) shift = -step()
          if (drag.from > projected && i >= projected && i < drag.from) shift = step()
        }

        return (
          <div
            key={id}
            ref={(el) => {
              rowRefs.current[i] = el
            }}
            style={{
              transform: `translateY(${isDragged ? drag!.dy : shift}px)`,
              transition: isDragged ? 'none' : 'transform .16s ease',
              zIndex: isDragged ? 2 : 1,
              position: 'relative',
              boxShadow: isDragged ? '0 10px 26px rgba(11,32,39,.22)' : undefined,
              borderRadius: 'var(--r-md)',
              touchAction: 'pan-y',
            }}
          >
            <div className="card row" style={{ gap: 10 }}>
              <DragHandle index={i} onStart={start} onMove={move} onEnd={end} onCancel={cancel} />
              {renderRow(id)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DragHandle({
  index,
  onStart,
  onMove,
  onEnd,
  onCancel,
}: {
  index: number
  onStart: (e: React.PointerEvent, i: number) => void
  onMove: (e: React.PointerEvent, startY: number) => void
  onEnd: (e?: React.PointerEvent) => void
  onCancel: () => void
}) {
  const startY = useRef(0)
  return (
    <span
      onPointerDown={(e) => {
        startY.current = e.clientY
        onStart(e, index)
      }}
      onPointerMove={(e) => onMove(e, startY.current)}
      onPointerUp={onEnd}
      onPointerCancel={onCancel}
      style={{
        color: 'var(--text-faint)',
        cursor: 'grab',
        touchAction: 'none',
        display: 'grid',
        placeItems: 'center',
        // Dotykový cíl aspoň 44 px, i když je ikona menší.
        width: 30,
        height: 44,
        marginLeft: -6,
        flex: 'none',
      }}
      aria-hidden
    >
      <GripVertical size={18} strokeWidth={1.8} />
    </span>
  )
}
