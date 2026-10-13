// Parcours complet dans un navigateur mobile (Playwright).
// Usage : npx vite build && npx vite preview --port 4174, puis
//         node tests/e2e-mobile.mjs [url] [dossier-captures]
import { chromium, devices } from 'playwright'

const URL = process.argv[2] || 'http://localhost:4174/'
const DOSSIER = process.argv[3] || '/tmp'
const browser = await chromium.launch()
const ctx = await browser.newContext({ ...devices['iPhone 13'] })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text()) })
const shot = (n) => page.screenshot({ path: `${DOSSIER}/v3-${n}.png` })
const fermer = () => page.locator('.voile').click({ position: { x: 5, y: 5 } }).catch(() => {})
const modifier = (fn, arg) => page.evaluate(([f, a]) => {
  const s = JSON.parse(localStorage.getItem('royaume-de-poche-v1'))
  new Function('s', 'a', f)(s, a)
  localStorage.setItem('royaume-de-poche-v1', JSON.stringify(s))
}, [fn, arg])
const etat = () => page.evaluate(() => JSON.parse(localStorage.getItem('royaume-de-poche-v1')))

async function attendreFinCombat(max = 160) {
  for (let k = 0; k < max && !(await page.locator('.bandeau').count()); k++) await page.waitForTimeout(500)
  return page.locator('.bandeau').first().innerText().catch(() => 'pas fini')
}

await page.goto(URL + '?vitesse=600')
await page.getByText('Commencer l\'aventure').click()
for (let i = 0; i < 5; i++) { await page.locator('.dialogue').click(); await page.waitForTimeout(150) }
await page.waitForTimeout(400); await shot('01-ville')

// Le parcours de la zone
await page.locator('.batisse', { hasText: 'Expédition' }).click(); await page.waitForTimeout(400); await shot('02-parcours')
await page.getByText('⚔️ Combattre').click()
await page.waitForTimeout(1300); await shot('03-aide')
await page.locator('.aide-combat').click(); await page.waitForTimeout(300); await shot('04-intentions')

// Joue à la main : héros, capacité, cible
let premier = true
for (let k = 0; k < 150; k++) {
  if (await page.locator('.bandeau').count()) break
  const cap = page.locator('.grille-caps .tuile-cap:not([disabled])').first()
  if (await cap.count() && await cap.isVisible()) {
    await cap.click(); await page.waitForTimeout(150)
    const cible = page.locator('.ennemi.ciblable').first()
    if (await cible.count()) { if (premier) { await shot('05-apercu'); premier = false } await cible.click() }
    const allie = page.locator('.carte-heros.ciblable').first()
    if (await allie.count()) await allie.click()
  }
  await page.waitForTimeout(350)
}
await page.waitForTimeout(600); await shot('06-rapport')
console.log('combat manuel :', await page.locator('.bandeau').first().innerText().catch(() => '?'))

// Case suivante en combat automatique
await page.locator('.btn', { hasText: 'Case suivante' }).click().catch(fermer)
await page.waitForTimeout(1200)
await page.locator('.puce', { hasText: 'Auto' }).click().catch(() => {})
console.log('combat auto :', await attendreFinCombat())
await fermer(); await page.waitForTimeout(400); await shot('07-parcours-avance')
console.log('case courante :', (await etat()).parcours.brioche.index)

// Le village : de l'or, on améliore le château, puis on construit
await modifier('s.or = 6000')
await page.locator('.nav-bas button').nth(2).click(); await page.waitForTimeout(400); await shot('08-village')
await page.locator('.parcelle.grande .parcelle-btn').click(); await page.waitForTimeout(300)
await page.reload(); await page.getByText('Continuer l\'aventure').click(); await page.waitForTimeout(400)
await page.locator('.nav-bas button').nth(2).click(); await page.waitForTimeout(300)
await page.locator('.parcelle.grande .parcelle-btn').click(); await page.waitForTimeout(300); await shot('09-fiche-chateau')
await page.locator('.btn', { hasText: 'Améliorer au niveau 2' }).click(); await page.waitForTimeout(500); await shot('10-chantier')
for (let k = 0; k < 20 && (await etat()).camp.chateau.niveau < 2; k++) await page.waitForTimeout(500)
await page.locator('.parcelle-btn', { hasText: 'Caserne' }).first().click(); await page.waitForTimeout(300)
await page.locator('.btn', { hasText: 'Construire' }).click(); await page.waitForTimeout(400)
for (let k = 0; k < 20 && (await etat()).camp.caserne.niveau < 1; k++) await page.waitForTimeout(500)
await page.waitForTimeout(600); await shot('11-village-caserne')
console.log('village :', JSON.stringify(Object.fromEntries(Object.entries((await etat()).camp).filter(([k]) => k !== 'chantiers').map(([k, v]) => [k, v.niveau]))))

// Le champion (au bout du parcours), avec ses intentions
await modifier("s.parcours.brioche = { index: 5, checkpoint: 5, recompenses: [0,1,2,3,4] }; for (const c of ['guerrier','mage','rodeur']) { s.heros[c].niveau = 7; s.heros[c].pv = 999; s.heros[c].pm = 999 }")
await page.evaluate(() => localStorage.setItem('rdp-auto', '0'))
await page.reload(); await page.getByText('Continuer l\'aventure').click(); await page.waitForTimeout(400)
await page.locator('.batisse', { hasText: 'Expédition' }).click(); await page.waitForTimeout(300)
await page.locator('.btn', { hasText: 'Entrer dans l\'arène' }).click(); await page.waitForTimeout(1300)
await page.locator('.aide-combat').click().catch(() => {})
await shot('12-champion')
// Tour 1 : on se met en garde pour voir la préparation au tour 2
for (let i = 0; i < 3; i++) { await page.locator('.mini-btn', { hasText: 'Garde' }).click().catch(() => {}); await page.waitForTimeout(500) }
await page.waitForTimeout(4500); await shot('13-champion-prepare')
await page.locator('.puce', { hasText: 'Auto' }).click()
const issue = await attendreFinCombat()
console.log('champion :', issue)
await page.waitForTimeout(300); await shot('14-eclat')
await fermer(); await page.waitForTimeout(300)
if (!issue.includes('Victoire')) {
  await modifier("s.eclats = ['champignard']; s.parcours.brioche = { index: 6, checkpoint: 6, recompenses: [0,1,2,3,4,5] }")
  await page.reload(); await page.getByText('Continuer l\'aventure').click(); await page.waitForTimeout(400)
}

// Défi du jour (débloqué après le premier champion)
await page.locator('.nav-bas button').first().click(); await page.waitForTimeout(300)
await shot('14b-ville')
await page.locator('.batisse', { hasText: 'Défi du jour' }).click(); await page.waitForTimeout(300); await shot('15-defi')
await page.locator('.btn', { hasText: 'Relever le défi' }).click(); await page.waitForTimeout(1300); await shot('16-defi-combat')
console.log('défi :', await attendreFinCombat())
await fermer()

// La route : un parcours, sans attente
await page.locator('.batisse', { hasText: 'Partir vers' }).click(); await page.waitForTimeout(300)
await page.getByText('C\'est parti !').click(); await page.waitForTimeout(400); await shot('17-route')

// Ancienne sauvegarde (version 2) : doit être mise à niveau
await modifier("s.version = 2; delete s.parcours; delete s.defi; s.voyage = { de: 'brioche', vers: 'gougere', debut: Date.now(), fin: Date.now() + 9e6, evenements: [] }; s.camp.entrainement = { niveau: 2, collecte: Date.now() }; s.camp.chantier = null; delete s.camp.chantiers; delete s.camp.chateau; delete s.camp.caserne; delete s.camp.remparts; delete s.camp.bibliotheque; delete s.camp.hutte; s.heros.guerrier.connues.push('lierre'); s.heros.guerrier.capacites[0] = 'lierre'")
await page.reload()
await page.getByText('Continuer l\'aventure').click(); await page.waitForTimeout(600); await shot('18-migration')
const m = await etat()
console.log('migration :', `version ${m.version}, Bastien : ${m.heros.guerrier.capacites.join(', ')}, route ${JSON.stringify(m.voyage.route)}, château ${m.camp.chateau.niveau}`)

console.log(errs.join('\n') || 'aucune erreur de page')
await browser.close()
