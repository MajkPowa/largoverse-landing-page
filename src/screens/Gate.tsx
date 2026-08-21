import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useApp } from '../store/useApp'
import { useT } from '../lib/useT'
import { Button } from '../components/ui'
import { BrandLockup } from '../components/Brand'

export function AccessGate() {
  const unlock = useApp((s) => s.unlock)
  const { t } = useT()
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const submit = () => {
    if (!unlock(code)) setError(true)
  }

  return (
    <div className="screen" style={{ background: 'var(--nav)' }}>
      <div
        className="screen__body"
        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <div style={{ display: 'grid', placeItems: 'center', marginBottom: 30 }}>
          <BrandLockup light />
        </div>

        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 400, margin: '0 0 8px' }}>
          {t('gateTitle')}
        </h1>
        <p style={{ color: '#ffffffaa', margin: '0 0 24px', fontSize: 14 }}>{t('gateLead')}</p>

        <label
          className="field field--icon"
          style={{ background: '#ffffff14', color: '#fff' }}
        >
          <span className="field__icon" style={{ color: '#ffffff88' }}>
            <Lock size={20} strokeWidth={1.6} />
          </span>
          <input
            value={code}
            placeholder={t('gateCode')}
            autoCapitalize="characters"
            onChange={(e) => {
              setCode(e.target.value)
              setError(false)
            }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            style={{ color: '#fff' }}
          />
        </label>

        {error && (
          <p style={{ color: '#ff9a92', fontSize: 13, margin: '10px 2px 0' }}>{t('gateError')}</p>
        )}

        <div style={{ marginTop: 20 }}>
          <Button onClick={submit} disabled={!code.trim()}>
            {t('gateEnter')}
          </Button>
        </div>
      </div>

      <div className="screen__footer">
        <p style={{ color: '#ffffff66', fontSize: 11, textAlign: 'center', margin: 0 }}>
          {t('gateNote')}
        </p>
      </div>
    </div>
  )
}
