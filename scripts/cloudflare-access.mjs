/**
 * Nastaví Cloudflare Access nad nasazenou ukázkou — přístup jen pro pozvané e-maily.
 *
 * Seznam e-mailů se čte z access-emails.txt (jeden na řádek, # je komentář).
 * Přidání nebo odebrání investora = úprava toho souboru a spuštění tohohle skriptu.
 *
 * Potřebuje API token s oprávněními:
 *   Account · Access: Apps and Policies · Edit
 *
 * Použití (PowerShell):
 *   $env:CLOUDFLARE_API_TOKEN = "..."
 *   $env:CLOUDFLARE_ACCOUNT_ID = "..."
 *   node scripts/cloudflare-access.mjs
 *
 * Nepodařilo-li se to, je vždycky po ruce ruční cesta přes dashboard —
 * postup je v README v sekci „Přístup jen pro pozvané e-maily".
 */

import { readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const EMAILS_FILE = join(ROOT, 'access-emails.txt')

const APP_NAME = 'LargoVerse — uzavřená beta'
const HOSTNAME = process.env.LARGOVERSE_HOST ?? 'largoverse-demo.pages.dev'
const SESSION = '24h'

const token = process.env.CLOUDFLARE_API_TOKEN
const account = process.env.CLOUDFLARE_ACCOUNT_ID

function bail(msg) {
  console.error(`\n✗ ${msg}\n`)
  process.exit(1)
}

if (!token) bail('Chybí CLOUDFLARE_API_TOKEN.')
if (!account) bail('Chybí CLOUDFLARE_ACCOUNT_ID.')
if (!existsSync(EMAILS_FILE)) bail(`Chybí ${EMAILS_FILE}. Vytvořte ho podle access-emails.example.txt.`)

const emails = readFileSync(EMAILS_FILE, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))

if (emails.length === 0) bail('V access-emails.txt není žádný e-mail.')

const bad = emails.filter((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
if (bad.length) bail(`Tohle nevypadá jako e-mail: ${bad.join(', ')}`)

const API = 'https://api.cloudflare.com/client/v4'

async function cf(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.success === false) {
    const errs = (body.errors ?? []).map((e) => `${e.code}: ${e.message}`).join('; ')
    throw new Error(`${init.method ?? 'GET'} ${path} → ${res.status}${errs ? ` (${errs})` : ''}`)
  }
  return body.result
}

console.log(`Hostname:  ${HOSTNAME}`)
console.log(`E-mailů:   ${emails.length}`)

/* 1. Najít existující aplikaci, nebo ji založit. */

const apps = await cf(`/accounts/${account}/access/apps`)
let app = apps.find((a) => a.domain === HOSTNAME)

if (app) {
  console.log(`Aplikace:  nalezena (${app.id})`)
} else {
  app = await cf(`/accounts/${account}/access/apps`, {
    method: 'POST',
    body: JSON.stringify({
      name: APP_NAME,
      domain: HOSTNAME,
      type: 'self_hosted',
      session_duration: SESSION,
      app_launcher_visible: false,
      auto_redirect_to_identity: false,
    }),
  })
  console.log(`Aplikace:  vytvořena (${app.id})`)
}

/* 2. Přepsat politiku seznamem pozvaných. */

const POLICY_NAME = 'Pozvaní investoři'
const include = emails.map((email) => ({ email: { email } }))

const policies = await cf(`/accounts/${account}/access/apps/${app.id}/policies`)
const existing = policies.find((p) => p.name === POLICY_NAME)

if (existing) {
  await cf(`/accounts/${account}/access/apps/${app.id}/policies/${existing.id}`, {
    method: 'PUT',
    body: JSON.stringify({ name: POLICY_NAME, decision: 'allow', include, precedence: 1 }),
  })
  console.log('Politika:  aktualizována')
} else {
  await cf(`/accounts/${account}/access/apps/${app.id}/policies`, {
    method: 'POST',
    body: JSON.stringify({ name: POLICY_NAME, decision: 'allow', include, precedence: 1 }),
  })
  console.log('Politika:  vytvořena')
}

console.log('\n✓ Hotovo. Přístup mají jen tyto adresy:')
emails.forEach((e) => console.log(`   · ${e}`))
console.log(`\nKdo přijde na https://${HOSTNAME}/ a není na seznamu, dovnitř se nedostane.`)
console.log('Kdo a kdy se přihlásil, uvidíte v Zero Trust → Logs → Access.')
