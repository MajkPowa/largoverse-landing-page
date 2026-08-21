/**
 * Značka LargoVerse — strom z původního loga plus vlastní nápis.
 *
 * Wordmark se sází jako text, ne jako obrázek: původní logo od klienta nese
 * nápis LARGOBANK, a ten se v aplikaci používat nemá.
 */
export function BrandLockup({
  light = false,
  size = 'md',
}: {
  light?: boolean
  size?: 'sm' | 'md'
}) {
  const treeSize = size === 'sm' ? 44 : 66
  const ink = light ? '#ffffff' : 'var(--primary)'

  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: size === 'sm' ? 8 : 12 }}>
      <div
        className="tree-mark"
        aria-hidden
        style={{ width: treeSize, height: treeSize - 2, backgroundColor: ink }}
      />
      <div
        style={{
          color: ink,
          fontSize: size === 'sm' ? 15 : 19,
          fontWeight: 300,
          letterSpacing: '0.22em',
          textIndent: '0.22em',
          lineHeight: 1,
        }}
      >
        LARGOVERSE
      </div>
    </div>
  )
}
