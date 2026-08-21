import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, FileText, Hourglass, ScanFace, ShieldCheck, UserRound } from 'lucide-react'
import { useApp } from '../store/useApp'
import { useT } from '../lib/useT'
import { Button, Option } from '../components/ui'

const DOC_TYPES = ['idCard', 'passport', 'driverLicense'] as const

export function KycIdentity() {
  const { t } = useT()
  const navigate = useNavigate()
  const docType = useApp((s) => s.kyc.docType)
  const setDocType = useApp((s) => s.setDocType)

  return (
    <div className="screen">
      <div className="screen__body">
        <h1 className="display-title" style={{ marginBottom: 18 }}>
          {t('verificationTitle')}
        </h1>
        <h2 className="section-title">{t('identityTitle')}</h2>
        <p className="lead">{t('kycLead')}</p>
        <div className="stack">
          {DOC_TYPES.map((d) => (
            <Option key={d} label={t(d)} selected={docType === d} onClick={() => setDocType(d)} />
          ))}
        </div>
      </div>
      <div className="screen__footer">
        <Button onClick={() => navigate('/kyc/documents')}>{t('continue')}</Button>
      </div>
    </div>
  )
}

function UploadTile({
  icon,
  title,
  filled,
  fileName,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  filled: boolean
  fileName: string
  onClick: () => void
}) {
  const { t } = useT()
  return (
    <button className="card row" style={{ width: '100%', gap: 14 }} onClick={onClick}>
      <span
        style={{
          width: 76,
          height: 56,
          borderRadius: 8,
          background: filled ? 'var(--primary)' : 'var(--primary-soft)',
          color: filled ? '#fff' : 'var(--primary)',
          display: 'grid',
          placeItems: 'center',
          flex: 'none',
        }}
      >
        {icon}
      </span>
      <span style={{ textAlign: 'left' }}>
        <span style={{ display: 'block', fontWeight: 500 }}>{title}</span>
        <span className="listrow__sub">{filled ? fileName : t('maxSize')}</span>
      </span>
    </button>
  )
}

export function KycDocuments() {
  const { t } = useT()
  const navigate = useNavigate()
  const kyc = useApp((s) => s.kyc)
  const setFlag = useApp((s) => s.setKycFlag)
  const ready = kyc.front && kyc.back

  return (
    <div className="screen">
      <div className="screen__body">
        <h1 className="display-title" style={{ marginBottom: 18 }}>
          {t('verificationTitle')}
        </h1>
        <h2 className="section-title">{t('uploadDocPhotos')}</h2>
        <p className="lead">{t('kycLead')}</p>
        <div className="stack">
          <UploadTile
            icon={<CreditCard size={26} strokeWidth={1.6} />}
            title={t('frontSide')}
            filled={kyc.front}
            fileName="IMG_2376 (1.8 MB)"
            onClick={() => setFlag('front', !kyc.front)}
          />
          <UploadTile
            icon={<CreditCard size={26} strokeWidth={1.6} />}
            title={t('backSide')}
            filled={kyc.back}
            fileName="IMG_2377 (1.9 MB)"
            onClick={() => setFlag('back', !kyc.back)}
          />
        </div>
      </div>
      <div className="screen__footer">
        <div className="btn-row">
          <Button variant="secondary" onClick={() => navigate('/kyc/identity')}>
            {t('back')}
          </Button>
          <Button disabled={!ready} onClick={() => navigate('/kyc/selfie')}>
            {t('continue')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function KycSelfie() {
  const { t } = useT()
  const navigate = useNavigate()
  const kyc = useApp((s) => s.kyc)

  return (
    <div className="screen">
      <div className="screen__body">
        <h1 className="display-title" style={{ marginBottom: 18 }}>
          {t('verificationTitle')}
        </h1>
        <h2 className="section-title">{t('selfieTitle')}</h2>
        <p className="lead">{t('kycLead')}</p>

        <button
          onClick={() => navigate('/kyc/selfie/capture')}
          style={{
            width: '100%',
            aspectRatio: '3 / 3.4',
            borderRadius: 12,
            border: '2px solid var(--primary)',
            background: kyc.selfie
              ? 'linear-gradient(160deg, #cfdde1, #a9c1c8)'
              : 'var(--surface-muted)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--primary)',
            overflow: 'hidden',
          }}
        >
          {kyc.selfie ? <PortraitSilhouette /> : <span className="muted">{t('selfieHint')}</span>}
        </button>
      </div>
      <div className="screen__footer">
        <div className="btn-row">
          <Button variant="secondary" onClick={() => navigate('/kyc/documents')}>
            {t('back')}
          </Button>
          <Button disabled={!kyc.selfie} onClick={() => navigate('/kyc/proofs')}>
            {t('continue')}
          </Button>
        </div>
      </div>
    </div>
  )
}

function PortraitSilhouette() {
  return (
    <svg width="70%" viewBox="0 0 100 120" aria-hidden>
      <circle cx="50" cy="42" r="24" fill="#5b7b85" opacity=".55" />
      <path d="M8 120c0-24 19-40 42-40s42 16 42 40Z" fill="#5b7b85" opacity=".55" />
    </svg>
  )
}

export function KycSelfieCapture() {
  const { t } = useT()
  const navigate = useNavigate()
  const setFlag = useApp((s) => s.setKycFlag)

  return (
    <div className="screen" style={{ background: '#1b2427' }}>
      <div
        className="screen__body screen__body--flush"
        style={{ position: 'relative', display: 'grid', placeItems: 'center' }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '8% 12%',
            border: '2px solid #ffffff88',
            borderRadius: '50% / 40%',
          }}
        />
        <PortraitSilhouette />
        <p style={{ position: 'absolute', bottom: 24, color: '#ffffffaa', fontSize: 13 }}>
          {t('selfieHint')}
        </p>
      </div>
      <div className="screen__footer" style={{ background: '#1b2427' }}>
        <button
          onClick={() => {
            setFlag('selfie', true)
            navigate('/kyc/selfie')
          }}
          style={{
            width: 68,
            height: 68,
            borderRadius: 999,
            border: '4px solid #fff',
            background: '#ffffff33',
            margin: '0 auto',
          }}
          aria-label={t('done')}
        />
      </div>
    </div>
  )
}

export function KycProofs() {
  const { t } = useT()
  const navigate = useNavigate()
  const kyc = useApp((s) => s.kyc)
  const setFlag = useApp((s) => s.setKycFlag)
  const submit = useApp((s) => s.submitKyc)
  const ready = kyc.utilityBill && kyc.bankStatement

  return (
    <div className="screen">
      <div className="screen__body">
        <h1 className="display-title" style={{ marginBottom: 18 }}>
          {t('verificationTitle')}
        </h1>
        <h2 className="section-title">{t('uploadDocs')}</h2>
        <p className="lead">{t('kycLead')}</p>
        <div className="stack">
          <UploadTile
            icon={<FileText size={26} strokeWidth={1.6} />}
            title={t('utilityBill')}
            filled={kyc.utilityBill}
            fileName="faktura_04.pdf (0.6 MB)"
            onClick={() => setFlag('utilityBill', !kyc.utilityBill)}
          />
          <UploadTile
            icon={<FileText size={26} strokeWidth={1.6} />}
            title={t('bankStatement')}
            filled={kyc.bankStatement}
            fileName="vypis_04.pdf (0.9 MB)"
            onClick={() => setFlag('bankStatement', !kyc.bankStatement)}
          />
        </div>
      </div>
      <div className="screen__footer">
        <div className="btn-row">
          <Button variant="secondary" onClick={() => navigate('/kyc/selfie')}>
            {t('back')}
          </Button>
          <Button
            disabled={!ready}
            onClick={() => {
              submit()
              navigate('/kyc/status')
            }}
          >
            {t('continue')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function KycStatusScreen() {
  const { t } = useT()
  const navigate = useNavigate()
  const status = useApp((s) => s.kyc.status)
  const approve = useApp((s) => s.approveKyc)

  // Simulace zpracování na straně banky.
  useEffect(() => {
    if (status !== 'pending') return
    const id = window.setTimeout(approve, 2600)
    return () => window.clearTimeout(id)
  }, [status, approve])

  const done = status === 'approved'

  return (
    <div className="screen">
      <div className="screen__body">
        <h1 className="display-title" style={{ marginBottom: 18 }}>
          {t('verificationTitle')}
        </h1>
        <h2 className="section-title">{t('statusTitle')}</h2>
        <p className="lead">{t('statusLead')}</p>

        <div style={{ display: 'grid', placeItems: 'center', marginTop: 28 }}>
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: 12,
              background: 'var(--surface)',
              display: 'grid',
              placeItems: 'center',
              gap: 14,
              color: 'var(--primary)',
            }}
          >
            {done ? (
              <ShieldCheck size={54} strokeWidth={1.4} />
            ) : (
              <Hourglass size={54} strokeWidth={1.4} />
            )}
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>
              {t(done ? 'approved' : 'pending')}
            </span>
          </div>
        </div>
      </div>
      <div className="screen__footer">
        {done ? (
          <Button onClick={() => navigate('/kyc/faceid')}>{t('continue')}</Button>
        ) : (
          <div className="btn-row">
            <Button variant="secondary" onClick={() => navigate('/kyc/proofs')}>
              {t('back')}
            </Button>
            <Button disabled>{t('continue')}</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function KycFaceId() {
  const { t } = useT()
  const navigate = useNavigate()
  const setFaceId = useApp((s) => s.setFaceId)

  return (
    <div className="screen">
      <div className="screen__body">
        <h1 className="display-title" style={{ marginBottom: 18 }}>
          {t('verificationTitle')}
        </h1>
        <h2 className="section-title">{t('faceIdTitle')}</h2>
        <p className="lead">{t('kycLead')}</p>

        <div style={{ display: 'grid', placeItems: 'center', marginTop: 28 }}>
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: 12,
              background: 'var(--surface)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--primary)',
            }}
          >
            <ScanFace size={64} strokeWidth={1.2} />
          </div>
        </div>
      </div>
      <div className="screen__footer">
        <Button
          onClick={() => {
            setFaceId(true)
            navigate('/app')
          }}
          icon={<UserRound size={18} />}
        >
          {t('enableFaceId')}
        </Button>
        <Button variant="ghost" onClick={() => navigate('/app')}>
          {t('continue')}
        </Button>
      </div>
    </div>
  )
}
