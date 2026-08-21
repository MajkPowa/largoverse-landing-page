import { useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  Bell,
  FileText,
  Globe,
  LifeBuoy,
  LogOut,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useApp } from '../store/useApp'
import { useT } from '../lib/useT'
import { shortDate } from '../lib/format'
import { languages } from '../i18n'
import { Button, MenuItem, TopBar } from '../components/ui'

export function Profile() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const holder = useApp((s) => s.holder)
  const kyc = useApp((s) => s.kyc)
  const setLang = useApp((s) => s.setLang)
  const signOut = useApp((s) => s.signOut)
  const resetDemo = useApp((s) => s.resetDemo)
  const showToast = useApp((s) => s.showToast)
  const simulateIncoming = useApp((s) => s.simulateIncoming)
  const simulateCardCharge = useApp((s) => s.simulateCardCharge)
  const simulateCryptoIn = useApp((s) => s.simulateCryptoIn)

  const currentLang = languages.find((l) => l.code === lang)

  const cycleLang = () => {
    const i = languages.findIndex((l) => l.code === lang)
    setLang(languages[(i + 1) % languages.length].code)
  }

  return (
    <div className="screen">
      <TopBar title={t('profileTitle')} onBack={() => navigate('/app')} />
      <div className="screen__body">
        <div className="card row" style={{ gap: 14, marginBottom: 18 }}>
          <span
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: 'var(--primary-soft)',
              color: 'var(--primary)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <UserRound size={28} strokeWidth={1.6} />
          </span>
          <span>
            <span style={{ display: 'block', fontSize: 18 }}>{holder}</span>
            {kyc.status === 'approved' && (
              <span className="row" style={{ gap: 5, color: 'var(--success)', fontSize: 13 }}>
                <BadgeCheck size={15} /> {t('verified')}
              </span>
            )}
          </span>
        </div>

        <div className="menu-list">
          <MenuItem icon={<UserRound size={20} strokeWidth={1.7} />} label={t('personalData')} />
          <MenuItem icon={<ShieldCheck size={20} strokeWidth={1.7} />} label={t('security')} />
          <MenuItem
            icon={<Globe size={20} strokeWidth={1.7} />}
            label={t('languageSetting')}
            sub={`${currentLang?.flag} ${currentLang?.label}`}
            onClick={cycleLang}
          />
          <MenuItem
            icon={<Bell size={20} strokeWidth={1.7} />}
            label={t('notificationsSetting')}
            onClick={() => navigate('/app/notifications')}
          />
          <MenuItem icon={<FileText size={20} strokeWidth={1.7} />} label={t('documents')} />
          <MenuItem icon={<LifeBuoy size={20} strokeWidth={1.7} />} label={t('support')} />
        </div>

        {/* Režim prezentace — ruční spouštěče, nikdy se nespustí samy. */}
        <div
          style={{
            marginTop: 20,
            padding: '16px 16px 18px',
            borderRadius: 'var(--r-md)',
            background: 'var(--surface)',
          }}
        >
          <div className="row" style={{ gap: 8, marginBottom: 6 }}>
            <PlayCircle size={18} strokeWidth={1.8} style={{ color: 'var(--primary)' }} />
            <strong style={{ fontSize: 15 }}>{t('presenterTitle')}</strong>
          </div>
          <p className="listrow__sub" style={{ margin: '0 0 14px' }}>
            {t('presenterLead')}
          </p>
          <div className="stack">
            <Button
              variant="secondary"
              onClick={() => {
                simulateIncoming()
                showToast(t('simDone'))
              }}
            >
              {t('simIncoming')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                simulateCardCharge()
                showToast(t('simDone'))
              }}
            >
              {t('simCardCharge')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                simulateCryptoIn()
                showToast(t('simDone'))
              }}
            >
              {t('simCryptoIn')}
            </Button>
          </div>
        </div>

        <div className="stack" style={{ marginTop: 20, paddingBottom: 30 }}>
          <Button
            variant="secondary"
            icon={<RotateCcw size={18} />}
            onClick={() => {
              resetDemo()
              showToast(t('resetDemoDone'))
              navigate('/')
            }}
          >
            {t('resetDemo')}
          </Button>
          <Button
            variant="ghost"
            icon={<LogOut size={18} />}
            onClick={() => {
              signOut()
              navigate('/')
            }}
          >
            {t('logout')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function Notifications() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const notifications = useApp((s) => s.notifications)
  const markRead = useApp((s) => s.markNotificationsRead)

  return (
    <div className="screen">
      <TopBar
        title={t('notificationsTitle')}
        onBack={() => navigate('/app')}
        right={
          notifications.some((n) => !n.read) ? (
            <button className="link" onClick={markRead} style={{ fontSize: 13 }}>
              {t('markAllRead')}
            </button>
          ) : undefined
        }
      />
      <div className="screen__body">
        {notifications.length === 0 && (
          <p className="muted" style={{ textAlign: 'center', marginTop: 80 }}>
            {t('noNotifications')}
          </p>
        )}
        <div className="stack">
          {notifications.map((n) => (
            <div key={n.id} className="card row" style={{ alignItems: 'flex-start', gap: 12 }}>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: n.read ? 'var(--surface-muted)' : 'var(--primary-soft)',
                  color: 'var(--primary)',
                  display: 'grid',
                  placeItems: 'center',
                  flex: 'none',
                }}
              >
                <Bell size={18} strokeWidth={1.7} />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: n.read ? 400 : 600 }}>{n.title}</span>
                <span className="listrow__sub" style={{ display: 'block' }}>
                  {n.body}
                </span>
                <span className="listrow__sub" style={{ display: 'block', marginTop: 4 }}>
                  {shortDate(n.date, lang)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
