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
const shot = (n) => page.screenshot({ path: `${DOSSIER}/v2-${n}.png` })

await page.goto(URL + '?vitesse=600')
await page.getByText('Commencer l\'aventure').click()
for (let i = 0; i < 5; i++) { await page.locator('.dialogue').click(); await page.waitForTimeout(150) }
await page.waitForTimeout(400); await shot('01-ville')

await page.locator('.place .batisse').first().click()
await page.waitForTimeout(1300); await shot('02-aide')
await page.locator('.aide-combat').click(); await page.waitForTimeout(300); await shot('03-combat')

// Joue à la main : héros, capacité, cible
let premier = true
for (let k = 0; k < 150; k++) {
  if (await page.locator('.bandeau').count()) break
  const cap = page.locator('.grille-caps .tuile-cap:not([disabled])').first()
  if (await cap.count() && await cap.isVisible()) {
    await cap.click(); await page.waitForTimeout(150)
    const cible = page.locator('.ennemi.ciblable').first()
    if (await cible.count()) { if (premier) { await shot('04-apercu'); premier = false } await cible.click() }
    const allie = page.locator('.carte-heros.ciblable').first()
    if (await allie.count()) await allie.click()
  }
  await page.waitForTimeout(350)
}
await page.waitForTimeout(600); await shot('05-rapport')
await page.locator('.voile').click({ position: { x: 5, y: 5 } }); await page.waitForTimeout(300)

await page.locator('.batisse', { hasText: 'Maître' }).click(); await page.waitForTimeout(400); await shot('06-maitre')
await page.getByText('Retour en ville').click()
await page.locator('.batisse', { hasText: 'Boulangerie' }).click(); await page.waitForTimeout(400); await shot('07-boulangerie')
await page.getByText('Retour en ville').click()
await page.locator('.nav-bas button').nth(1).click(); await page.waitForTimeout(400)
await page.locator('.panneau', { hasText: 'Capacités au combat' }).scrollIntoViewIfNeeded(); await shot('08-capacites')
await page.locator('.nav-bas button').nth(2).click(); await page.waitForTimeout(400); await shot('09-camp')

// Combat automatique
await page.locator('.nav-bas button').first().click(); await page.waitForTimeout(300)
await page.locator('.place .batisse').first().click(); await page.waitForTimeout(1200)
await page.locator('.puce', { hasText: 'Auto' }).click()
for (let k = 0; k < 80 && !(await page.locator('.bandeau').count()); k++) await page.waitForTimeout(500)
console.log('combat auto :', await page.locator('.bandeau').first().innerText().catch(() => 'pas fini'))
await page.locator('.voile').click({ position: { x: 5, y: 5 } }).catch(() => {})

// Ancienne sauvegarde (version 1) : doit être mise à niveau
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('royaume-de-poche-v1'))
  s.version = 1
  for (const c of ['guerrier', 'mage', 'rodeur']) { delete s.heros[c].connues; delete s.heros[c].capacites; s.heros[c].niveau = 8 }
  delete s.camp.herboristerie; delete s.repas; delete s.expedition; delete s.aides
  localStorage.setItem('royaume-de-poche-v1', JSON.stringify(s))
  localStorage.setItem('rdp-auto', '0')
})
await page.reload()
await page.getByText('Continuer l\'aventure').click(); await page.waitForTimeout(500)
console.log('migration :', await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('royaume-de-poche-v1'))
  return `version ${s.version}, capacités de Lulu : ${s.heros.mage.capacites.join(', ')}`
}))
await page.locator('.place .batisse').first().click(); await page.waitForTimeout(1300); await shot('10-combat-migre')

console.log(errs.join('\n') || 'aucune erreur de page')
await browser.close()
