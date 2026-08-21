import { useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../store/useApp'
import { useT } from '../lib/useT'
import { languages, type Lang } from '../i18n'
import { Button, Field, Option, TopBar } from '../components/ui'
import { Flag } from '../components/Flags'

/* ------------------------------------------------------------------ jazyk */

export function Language() {
  const { lang } = useT()
  const { t } = useT()
  const setLang = useApp((s) => s.setLang)
  const confirmLanguage = useApp((s) => s.confirmLanguage)
  const navigate = useNavigate()

  return (
    <div className="screen">
      <div className="screen__body">
        <h1 className="display-title">{t('languageTitle')}</h1>
        <div className="stack">
          {languages.map((l) => (
            <Option
              key={l.code}
              label={l.label}
              selected={lang === l.code}
              icon={<Flag lang={l.code} />}
              onClick={() => setLang(l.code as Lang)}
            />
          ))}
        </div>
      </div>
      <div className="screen__footer">
        <Button
          onClick={() => {
            confirmLanguage()
            navigate('/onboarding')
          }}
        >
          {t('continue')}
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- onboarding */

const SLIDES = ['ob1Title', 'ob2Title', 'ob3Title', 'ob4Title'] as const

export function Onboarding() {
  const { t } = useT()
  const finish = useApp((s) => s.finishOnboarding)
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const last = index === SLIDES.length - 1

  const done = () => {
    finish()
    navigate('/register')
  }

  return (
    <div className="screen">
      <div className="screen__body" style={{ display: 'flex', flexDirection: 'column' }}>
        <OnboardingArt step={index} />
        <h1 style={{ fontSize: 27, fontWeight: 400, margin: '22px 0 10px', letterSpacing: '-0.015em' }}>
          {t(SLIDES[index])}
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          {t('obBody')}
        </p>
      </div>
      <div className="screen__footer">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="row" style={{ gap: 6 }}>
            {SLIDES.map((_, i) => (
              <span
                key={i}
                onClick={() => setIndex(i)}
                style={{
                  width: i === index ? 22 : 6,
                  height: 4,
                  borderRadius: 2,
                  background: i === index ? 'var(--primary)' : 'var(--text-faint)',
                  opacity: i === index ? 1 : 0.5,
                  transition: 'width .2s ease',
                  cursor: 'pointer',
                }}
              />
            ))}
          </span>
          <button className="link" onClick={() => (last ? done() : setIndex(index + 1))}>
            {last ? t('obEnter') : t('skip')}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Ilustrace: telefon s náznakem obrazovky, v duchu prototypu. */
function OnboartingFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: '#dfe8ea',
        borderRadius: 16,
        padding: '26px 0 0',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        flex: 1,
        minHeight: 300,
      }}
    >
      <div
        style={{
          width: 186,
          height: '100%',
          border: '7px solid #10171a',
          borderBottom: 'none',
          borderRadius: '30px 30px 0 0',
          background: '#e7eef0',
          padding: 14,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 9,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 62,
            height: 17,
            borderRadius: 999,
            background: '#10171a',
          }}
        />
        <div style={{ marginTop: 28 }}>{children}</div>
      </div>
    </div>
  )
}

function OnboardingArt({ step }: { step: number }) {
  const bar = (w: string, h = 10, c = '#c3d4d9') => (
    <div style={{ width: w, height: h, borderRadius: 4, background: c }} />
  )
  return (
    <OnboartingFrame>
      {step === 0 && (
        <div style={{ display: 'grid', gap: 10, placeItems: 'center' }}>
          <div className="tree-mark" style={{ width: 62, height: 60, opacity: 0.9 }} />
          {bar('100%', 12)}
          {bar('70%')}
          <div
            style={{ width: '100%', height: 34, borderRadius: 999, background: 'var(--primary)', marginTop: 8 }}
          />
        </div>
      )}
      {step === 1 && (
        <div style={{ display: 'grid', gap: 10 }}>
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                height: 62,
                borderRadius: 10,
                background: `linear-gradient(135deg, var(--card-from), var(--card-to))`,
                opacity: 1 - i * 0.25,
              }}
            />
          ))}
          {bar('60%')}
        </div>
      )}
      {step === 2 && (
        <div style={{ display: 'grid', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="row" style={{ gap: 8 }}>
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: 'var(--primary)',
                  opacity: 0.85 - i * 0.2,
                }}
              />
              <span style={{ flex: 1, display: 'grid', gap: 5 }}>
                {bar('100%', 8)}
                {bar('55%', 6, '#d5e1e5')}
              </span>
            </div>
          ))}
        </div>
      )}
      {step === 3 && (
        <div style={{ display: 'grid', gap: 12, placeItems: 'center' }}>
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 999,
              background: '#fff',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <div className="tree-mark" style={{ width: 56, height: 54 }} />
          </div>
          {bar('80%')}
          {bar('55%')}
        </div>
      )}
    </OnboartingFrame>
  )
}

/* ------------------------------------------------- registrace / přihlášení */

function looksLikePhone(value: string) {
  return /^[+\d\s()-]{6,}$/.test(value.trim())
}

function SocialButtons() {
  const { t } = useT()
  const signIn = useApp((s) => s.signIn)
  const kyc = useApp((s) => s.kyc)
  const navigate = useNavigate()
  const go = () => {
    signIn()
    // Kdo už je ověřený, nemá spadnout zpátky do KYC.
    navigate(kyc.status === 'approved' ? '/app' : '/kyc/identity')
  }
  return (
    <div className="stack">
      <Button variant="social" onClick={go} icon={<GoogleGlyph />}>
        {t('withGoogle')}
      </Button>
      <Button variant="social" onClick={go} icon={<AppleGlyph />}>
        {t('withApple')}
      </Button>
      <Button variant="social" onClick={go} icon={<FacebookGlyph />}>
        {t('withFacebook')}
      </Button>
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="var(--primary)"
        d="M21.6 12.2c0-.7-.06-1.4-.18-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z"
      />
      <path
        fill="var(--primary)"
        d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"
        opacity=".75"
      />
      <path
        fill="var(--primary)"
        d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z"
        opacity=".55"
      />
      <path
        fill="var(--primary)"
        d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 3 14.7 2 12 2a10 10 0 0 0-8.9 5.4L6.4 10c.8-2.3 3-4.1 5.6-4.1Z"
        opacity=".9"
      />
    </svg>
  )
}

function AppleGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--text)" aria-hidden>
      <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.7 0 0-2.5-1-2.5-3.6ZM14.2 5.4c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3Z" />
    </svg>
  )
}

function FacebookGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="5" fill="var(--primary)" />
      <path
        fill="#fff"
        d="M15.3 12.5h-2v7h-2.9v-7H9v-2.4h1.4V8.7c0-1.9 1.1-3 2.9-3h2.2v2.4h-1.4c-.6 0-.8.3-.8.8v1.2h2.3l-.3 2.4Z"
      />
    </svg>
  )
}

function AuthEntry({ mode }: { mode: 'register' | 'login' }) {
  const { t } = useT()
  const navigate = useNavigate()
  const [value, setValue] = useState('')

  const next = () => {
    const path = looksLikePhone(value) ? 'phone' : 'email'
    navigate(`/${mode}/${path}`, { state: { value } })
  }

  return (
    <div className="screen">
      <div className="screen__body">
        <h1 className="display-title">{t(mode === 'register' ? 'registerTitle' : 'loginTitle')}</h1>
        <div className="stack">
          <Field
            value={value}
            onChange={setValue}
            placeholder={t(mode === 'register' ? 'registerPlaceholder' : 'loginPlaceholder')}
          />
          <Button onClick={next} disabled={!value.trim()}>
            {t('continue')}
          </Button>
        </div>
        <div style={{ height: 24 }} />
        <SocialButtons />
      </div>
      <div className="screen__footer">
        <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
          {t(mode === 'register' ? 'haveAccount' : 'noAccount')}{' '}
          <button
            className="link"
            onClick={() => navigate(mode === 'register' ? '/login' : '/register')}
          >
            {t(mode === 'register' ? 'signIn' : 'createOne')}
          </button>
        </p>
      </div>
    </div>
  )
}

export function Register() {
  return <AuthEntry mode="register" />
}

export function Login() {
  return <AuthEntry mode="login" />
}

/** Hodnota zadaná na předchozí obrazovce, jinak ukázková z návrhu. */
function usePassedValue(fallback: string) {
  const { state } = useLocation()
  const passed = (state as { value?: string } | null)?.value
  return useState(passed?.trim() ? passed : fallback)
}

function AuthFooter({ mode }: { mode: 'register' | 'login' }) {
  const { t } = useT()
  const navigate = useNavigate()
  return (
    <div className="screen__footer">
      <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
        {t(mode === 'register' ? 'haveAccount' : 'noAccount')}{' '}
        <button className="link" onClick={() => navigate(mode === 'register' ? '/login' : '/register')}>
          {t(mode === 'register' ? 'signIn' : 'createOne')}
        </button>
      </p>
    </div>
  )
}

export function RegisterEmail() {
  const { t } = useT()
  const navigate = useNavigate()
  const signIn = useApp((s) => s.signIn)
  const [email, setEmail] = usePassedValue('example@gmail.com')
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const ready = email.includes('@') && pwd.length >= 4 && pwd === pwd2

  return (
    <div className="screen">
      <div className="screen__body">
        <h1 className="display-title" style={{ marginBottom: 8 }}>
          {t('registerTitle')}
        </h1>
        <TopBar onBack={() => navigate('/register')} title={t('back')} />
        <div className="stack" style={{ marginTop: 8 }}>
          <Field label={t('email')} value={email} onChange={setEmail} type="email" />
          <Field label={t('password')} value={pwd} onChange={setPwd} type="password" />
          <Field label={t('passwordConfirm')} value={pwd2} onChange={setPwd2} type="password" />
          <Button
            disabled={!ready}
            onClick={() => {
              signIn()
              navigate('/kyc/identity')
            }}
          >
            {t('createAccount')}
          </Button>
        </div>
      </div>
      <AuthFooter mode="register" />
    </div>
  )
}

export function RegisterPhone() {
  const { t } = useT()
  const navigate = useNavigate()
  const signIn = useApp((s) => s.signIn)
  const showToast = useApp((s) => s.showToast)
  const [phone, setPhone] = usePassedValue('123 456 789')
  const [code, setCode] = useState('')

  return (
    <div className="screen">
      <div className="screen__body">
        <h1 className="display-title" style={{ marginBottom: 8 }}>
          {t('registerTitle')}
        </h1>
        <TopBar onBack={() => navigate('/register')} title={t('back')} />
        <div className="stack" style={{ marginTop: 8 }}>
          <Field label={t('phone')} value={phone} onChange={setPhone} type="tel" />
          <Field label={t('smsCode')} value={code} onChange={setCode} />
          <Button
            disabled={code.length < 4}
            onClick={() => {
              signIn()
              navigate('/kyc/identity')
            }}
          >
            {t('createAccount')}
          </Button>
          <Button variant="ghost" onClick={() => showToast(t('resend'))}>
            {t('resend')}
          </Button>
        </div>
      </div>
      <AuthFooter mode="register" />
    </div>
  )
}

export function LoginEmail() {
  const { t } = useT()
  const navigate = useNavigate()
  const signIn = useApp((s) => s.signIn)
  const kyc = useApp((s) => s.kyc)
  const [email, setEmail] = usePassedValue('example@gmail.com')
  const [pwd, setPwd] = useState('')

  return (
    <div className="screen">
      <div className="screen__body">
        <h1 className="display-title" style={{ marginBottom: 8 }}>
          {t('loginTitle')}
        </h1>
        <TopBar onBack={() => navigate('/login')} title={t('back')} />
        <div className="stack" style={{ marginTop: 8 }}>
          <Field label={t('email')} value={email} onChange={setEmail} type="email" />
          <Field label={t('password')} value={pwd} onChange={setPwd} type="password" />
          <div style={{ textAlign: 'right' }}>
            <button className="link" onClick={() => navigate('/forgot')}>
              {t('forgotPassword')}
            </button>
          </div>
          <Button
            disabled={pwd.length < 4}
            onClick={() => {
              signIn()
              navigate(kyc.status === 'approved' ? '/app' : '/kyc/identity')
            }}
          >
            {t('signInCta')}
          </Button>
        </div>
      </div>
      <AuthFooter mode="login" />
    </div>
  )
}

export function LoginPhone() {
  const { t } = useT()
  const navigate = useNavigate()
  const signIn = useApp((s) => s.signIn)
  const kyc = useApp((s) => s.kyc)
  const showToast = useApp((s) => s.showToast)
  const [phone, setPhone] = usePassedValue('123 456 789')
  const [code, setCode] = useState('')

  return (
    <div className="screen">
      <div className="screen__body">
        <h1 className="display-title" style={{ marginBottom: 8 }}>
          {t('loginTitle')}
        </h1>
        <TopBar onBack={() => navigate('/login')} title={t('back')} />
        <div className="stack" style={{ marginTop: 8 }}>
          <Field label={t('phone')} value={phone} onChange={setPhone} type="tel" />
          <Field label={t('smsCode')} value={code} onChange={setCode} />
          <Button
            disabled={code.length < 4}
            onClick={() => {
              signIn()
              navigate(kyc.status === 'approved' ? '/app' : '/kyc/identity')
            }}
          >
            {t('signInCta')}
          </Button>
          <Button variant="ghost" onClick={() => showToast(t('resend'))}>
            {t('resend')}
          </Button>
        </div>
      </div>
      <AuthFooter mode="login" />
    </div>
  )
}

export function ForgotPassword() {
  const { t } = useT()
  const navigate = useNavigate()
  const [value, setValue] = useState('')

  return (
    <div className="screen">
      <div className="screen__body">
        <h1 className="display-title" style={{ marginBottom: 6 }}>
          {t('forgotTitle')}
        </h1>
        <p className="lead">{t('forgotLead')}</p>
        <div className="stack">
          <Field value={value} onChange={setValue} placeholder={t('emailOrPhone')} />
          <Button disabled={!value.trim()} onClick={() => navigate('/forgot/sent')}>
            {t('send')}
          </Button>
        </div>
      </div>
      <div className="screen__footer">
        <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
          {t('rememberPassword')}{' '}
          <button className="link" onClick={() => navigate('/login')}>
            {t('backToLogin')}
          </button>
        </p>
      </div>
    </div>
  )
}

export function ForgotSent() {
  const { t } = useT()
  const navigate = useNavigate()

  return (
    <div className="screen">
      <div className="screen__body">
        <h1 className="display-title" style={{ marginBottom: 6 }}>
          {t('mailSentTitle')}
        </h1>
        <p className="lead">{t('forgotLead')}</p>
        <div className="stack">
          <Field value="" readOnly placeholder={t('emailOrPhone')} />
          <Button onClick={() => navigate('/login')}>{t('backToLogin')}</Button>
        </div>
      </div>
      <div className="screen__footer">
        <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
          {t('wrongAddress')}{' '}
          <button className="link" onClick={() => navigate('/forgot')}>
            {t('useAnother')}
          </button>
        </p>
      </div>
    </div>
  )
}

