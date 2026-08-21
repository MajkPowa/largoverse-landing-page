/**
 * Zabalí hotový build do jediné zašifrované stránky.
 *
 * Proč: GitHub Pages umí jen veřejné adresy. Klient ale chce uzavřený investorský
 * okruh. Řešení je nedávat na veřejnou adresu aplikaci, ale její šifru — kdo nemá
 * heslo, stáhne si jen náhodná data. Dešifruje se až v prohlížeči, klíč se odvozuje
 * z hesla (PBKDF2-SHA256, 310 000 iterací) a nikde se neukládá.
 *
 * Použití:
 *   npm run build:secure -- --pass "heslo"
 *
 * Skript si sám spustí `vite build` s vypnutou vnitřní bránou (VITE_GATE=off),
 * protože heslo se u šifrovaného buildu zadává už na dveřích.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'
import { webcrypto as crypto } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = join(ROOT, 'dist')
const CLIENT_DIST = join(DIST, 'client')
const OUT = join(ROOT, 'deploy')

const PBKDF2_ITERATIONS = 310_000
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }

/* ------------------------------------------------------------------ vstup */

function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 ? process.argv[i + 1] : undefined
}

const passphrase = arg('pass') ?? process.env.DEPLOY_PASSPHRASE
if (!passphrase || passphrase.length < 8) {
  console.error('Chybí heslo. Použij --pass "..." nebo proměnnou DEPLOY_PASSPHRASE (min. 8 znaků).')
  process.exit(1)
}

/**
 * Klíč se odvozuje z normalizovaného hesla, ne z toho, co uživatel doslova napsal.
 * Kód se opisuje z papíru nebo ze zprávy, často na mobilu — velikost písmen,
 * pomlčky a mezery nesmí rozhodovat o tom, jestli se investor dostane dovnitř.
 * STEJNÁ normalizace musí být v zaváděcí stránce níže.
 */
const normalize = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')
const secret = normalize(passphrase)
if (secret.length < 8) {
  console.error('Heslo musí mít aspoň 8 písmen nebo číslic (pomlčky a mezery se nepočítají).')
  process.exit(1)
}
console.log('Sestavuji aplikaci (VITE_GATE=off)…')
rmSync(DIST, { recursive: true, force: true })

// Binárky voláme přes node přímo — npm.cmd se na Windows z execFileSync spustit nedá.
const run = (bin, args) =>
  execFileSync(process.execPath, [join(ROOT, 'node_modules', bin), ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, VITE_GATE: 'off' },
  })

run('typescript/bin/tsc', ['-b', '--noEmit'])
run('vite/bin/vite.js', ['build'])

if (!existsSync(CLIENT_DIST)) {
  console.error('Build neproběhl — chybí složka dist/client/.')
  process.exit(1)
}

/* ------------------------------------------- složení jednosouborové aplikace */

const assetsDir = join(CLIENT_DIST, 'assets')
const assetFiles = readdirSync(assetsDir)

const cssFile = assetFiles.find((f) => f.endsWith('.css'))
const jsFile = assetFiles.find((f) => f.endsWith('.js'))
if (!cssFile || !jsFile) {
  console.error('V dist/assets chybí CSS nebo JS. Build asi neproběhl celý.')
  process.exit(1)
}

let css = readFileSync(join(assetsDir, cssFile), 'utf8')
let js = readFileSync(join(assetsDir, jsFile), 'utf8')

// Obrázky (masky loga) vložíme rovnou do CSS jako data URI, ať nezůstane nic venku.
let inlined = 0
css = css.replace(/url\((['"]?)([^)'"]+\.(?:png|jpg|svg|woff2))\1\)/g, (whole, _q, ref) => {
  const name = ref.split('/').pop()
  const path = join(assetsDir, name)
  if (!existsSync(path)) return whole
  const mime = MIME[extname(name)] ?? 'application/octet-stream'
  inlined++
  return `url("data:${mime};base64,${readFileSync(path).toString('base64')}")`
})

// Vite zapisuje obrázky importované z TSX jako relativní URL přímo do JS.
// I ty musí být data URI, jinak by jednosouborový šifrovaný build hledal soubory vedle sebe.
for (const name of assetFiles) {
  const mime = MIME[extname(name)]
  if (!mime) continue
  const dataUri = `data:${mime};base64,${readFileSync(join(assetsDir, name)).toString('base64')}`
  if (js.includes(name)) {
    js = js.replaceAll(name, dataUri)
    inlined++
  }
}

const payload = JSON.stringify({ css, js })

/* ------------------------------------------------------------- šifrování */

const enc = new TextEncoder()
const salt = crypto.getRandomValues(new Uint8Array(16))
const iv = crypto.getRandomValues(new Uint8Array(12))

const baseKey = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey'])
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
  baseKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt'],
)
const cipher = new Uint8Array(
  await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(payload)),
)

const b64 = (u8) => Buffer.from(u8).toString('base64')

/* ------------------------------------------------------- zaváděcí stránka */

const loader = `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
<meta name="referrer" content="no-referrer" />
<meta name="theme-color" content="#02050a" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230e2a2e'/%3E%3Cpath d='M16 7c4 0 7 3 7 6.5S20 20 16 20s-7-3-7-6.5S12 7 16 7z' fill='%23bcd3da'/%3E%3Crect x='15' y='17' width='2' height='8' fill='%23bcd3da'/%3E%3C/svg%3E" />
<title>LargoVerse</title>
<style>
  :root{--ink:#0e2a2e;--paper:#f1f2f2;--accent:#15607e}
  *{box-sizing:border-box}
  html,body{height:100%;margin:0}
  body{background:radial-gradient(circle at 50% 25%,#16323a,#0b1416 70%);color:#fff;
    font-family:'Outfit','Segoe UI',system-ui,-apple-system,sans-serif;display:grid;place-items:center;padding:24px}
  main{width:100%;max-width:340px;text-align:center}
  .mark{width:74px;height:74px;margin:0 auto 22px;background:#e8eff1;
    -webkit-mask:url("data:image/png;base64,__TREE__") center/contain no-repeat;
    mask:url("data:image/png;base64,__TREE__") center/contain no-repeat}
  h1{font-size:21px;font-weight:400;margin:0 0 6px;letter-spacing:.01em}
  p{color:#ffffff9c;font-size:13.5px;line-height:1.5;margin:0 0 24px}
  form{display:grid;gap:12px}
  input{width:100%;padding:15px 16px;border-radius:14px;border:1px solid #ffffff26;
    background:#ffffff14;color:#fff;font:inherit;font-size:15px;text-align:center;letter-spacing:.06em}
  input::placeholder{color:#ffffff5c;letter-spacing:normal}
  input:focus{outline:none;border-color:var(--accent);background:#ffffff1f}
  button{padding:15px;border:0;border-radius:999px;background:var(--accent);color:#fff;
    font:inherit;font-weight:600;font-size:15px;cursor:pointer}
  button:disabled{opacity:.45;cursor:default}
  .err{color:#ff9a92;font-size:13px;min-height:18px;margin:0}
  .hint{color:#ffffff6b;font-size:12px;margin:-4px 0 0}
  .note{color:#ffffff4d;font-size:11px;line-height:1.5;margin-top:26px}
  @media (prefers-reduced-motion:no-preference){.busy{animation:pulse 1s ease-in-out infinite}}
  @keyframes pulse{50%{opacity:.55}}
</style>
</head>
<body>
<main>
  <div class="mark"></div>
  <h1>LargoVerse — uzavřená beta</h1>
  <p>Ukázka je určena pouze pro pozvaný investorský okruh. Zadejte prosím přístupový kód.</p>
  <form id="f">
    <input id="p" type="password" placeholder="Přístupový kód" autocomplete="off"
      autocapitalize="characters" autocorrect="off" spellcheck="false"
      inputmode="text" required />
    <p class="hint">Na velikosti písmen ani na pomlčkách nezáleží.</p>
    <button id="b" type="submit">Vstoupit</button>
    <p class="err" id="e"></p>
  </form>
  <p class="note">Nejedná se o bankovní službu. Všechna data v ukázce jsou smyšlená.</p>
</main>
<script>
(function () {
  var D = { salt: "__SALT__", iv: "__IV__", data: "__DATA__", it: __ITER__ };
  var f = document.getElementById('f'), p = document.getElementById('p'),
      b = document.getElementById('b'), e = document.getElementById('e');

  function bytes(b64) {
    var s = atob(b64), u = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u;
  }

  f.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (!window.crypto || !window.crypto.subtle) {
      e.textContent = 'Prohlížeč nepodporuje potřebné šifrování. Zkuste prosím jiný.';
      return;
    }
    e.textContent = '';
    b.disabled = true; b.textContent = 'Odemykám…'; b.className = 'busy';

    // Stejná normalizace jako při buildu — velikost písmen, pomlčky a mezery nerozhodují.
    var secret = p.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: bytes(D.salt), iterations: D.it, hash: 'SHA-256' },
          base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      })
      .then(function (key) {
        return crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(D.iv) }, key, bytes(D.data));
      })
      .then(function (buf) {
        var app = JSON.parse(new TextDecoder().decode(buf));
        document.body.innerHTML = '<div id="root"></div>';
        document.head.querySelectorAll('style').forEach(function (n) { n.remove(); });

        var fonts = document.createElement('link');
        fonts.rel = 'stylesheet';
        fonts.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap';
        document.head.appendChild(fonts);

        var style = document.createElement('style');
        style.textContent = app.css;
        document.head.appendChild(style);

        var script = document.createElement('script');
        script.type = 'module';
        script.textContent = app.js;
        document.body.appendChild(script);
      })
      .catch(function () {
        b.disabled = false; b.textContent = 'Vstoupit'; b.className = '';
        e.textContent = 'Neplatný kód.';
        p.value = ''; p.focus();
      });
  });
})();
</script>
</body>
</html>
`

/* --------------------------------------------------------------- zápis */

const treeB64 = (() => {
  const f = assetFiles.find((n) => n.startsWith('largo-tree') && n.endsWith('.png'))
  return f ? readFileSync(join(assetsDir, f)).toString('base64') : ''
})()

const html = loader
  .replaceAll('__TREE__', treeB64)
  .replace('__SALT__', b64(salt))
  .replace('__IV__', b64(iv))
  .replace('__DATA__', b64(cipher))
  .replace('__ITER__', String(PBKDF2_ITERATIONS))

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'index.html'), html, 'utf8')
writeFileSync(join(OUT, '.nojekyll'), '')
writeFileSync(
  join(OUT, 'robots.txt'),
  'User-agent: *\nDisallow: /\n',
)

const kb = (n) => `${(n / 1024).toFixed(1)} kB`
console.log(`deploy/index.html  ${kb(Buffer.byteLength(html))}`)
console.log(`  vložených assetů: ${inlined}, šifrováno: ${kb(payload.length)} → ${kb(cipher.length)}`)
console.log(`  PBKDF2-SHA256 ${PBKDF2_ITERATIONS.toLocaleString('cs-CZ')} iterací, AES-GCM 256`)
