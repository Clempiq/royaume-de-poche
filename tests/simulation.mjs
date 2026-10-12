// Simule des parties complètes avec l'IA pour vérifier l'équilibrage.
// Usage : node tests/simulation.mjs [nombre de parties]
import { creerCombat, bilanCombat } from '../src/engine/battle.js'
import * as G from '../src/engine/game.js'
import { VILLES, ORDRE_VILLES } from '../src/data/world.js'
import { ORDRE_EQUIPE } from '../src/data/heroes.js'
import { statsObjet } from '../src/engine/loot.js'
import { jouerCombat } from './ia-joueur.js'

const valeur = (o) => Object.entries(statsObjet(o)).reduce((s, [k, v]) => s + v * (k === 'pv' ? 0.25 : 1), 0) + Object.values(o.elem).reduce((s, v) => s + v * 0.1, 0)

function equiperMieux(s) {
  for (const c of ORDRE_EQUIPE) {
    for (const slot of ['arme', 'armure', 'accessoire']) {
      const cands = s.inventaire.filter((o) => o.slot === slot && (!o.classe || o.classe === c) && (!G.porteur(s, o.id) || G.porteur(s, o.id) === c))
      const best = cands.sort((a, b) => valeur(b) - valeur(a))[0]
      if (best && s.heros[c].equip[slot] !== best.id) G.equiper(s, c, best.id)
    }
  }
  for (const o of [...s.inventaire]) if (!G.estEquipe(s, o.id)) G.vendre(s, o.id)
}

function partie() {
  const s = G.nouvellePartie()
  const res = { combats: {}, defaitesArene: {}, niveauArene: {}, defaites: 0 }
  for (const v of ORDRE_VILLES) {
    res.combats[v] = 0
    res.defaitesArene[v] = 0
    const arene = VILLES[v].arene
    let pause = 0
    for (let essais = 0; essais < 600; essais++) {
      G.seReposer(s)
      equiperMieux(s)
      while (s.or > 200 && (s.sac.potion || 0) < 6) G.acheterConsommable(s, 'potion')
      const moy = ORDRE_EQUIPE.reduce((t, c) => t + s.heros[c].niveau, 0) / 3
      const contexte = pause <= 0 && moy >= arene.conseil + Number(process.env.DECALAGE || 0) ? 'arene' : 'sauvage'
      pause--
      const ennemis = contexte === 'arene' ? G.rencontreArene(s) : G.rencontreSauvage(s)
      const b = creerCombat({ heros: G.herosPourCombat(s), ennemis, boss: contexte === 'arene', sac: s.sac })
      jouerCombat(b)
      const r = G.finCombat(s, bilanCombat(b), contexte)
      if (contexte === 'sauvage') res.combats[v]++
      if (r.issue === 'defaite') res.defaites++
      if (contexte === 'arene') {
        if (r.issue === 'victoire') {
          res.niveauArene[v] = ORDRE_EQUIPE.map((c) => s.heros[c].niveau).join('/')
          break
        }
        res.defaitesArene[v]++
        pause = 3
      }
    }
    if (!s.eclats.includes(arene.boss)) { res.bloque = v; break }
    if (VILLES[v].suivante) {
      G.partirEnVoyage(s)
      s.voyage.fin = 0
      G.arriver(s)
    }
  }
  res.or = s.or
  return res
}

const n = Number(process.argv[2] || 20)
const tout = Array.from({ length: n }, partie)
const moy = (f) => (tout.reduce((t, r) => t + f(r), 0) / n).toFixed(1)
for (const v of ORDRE_VILLES) {
  console.log(`${v.padEnd(9)} combats sauvages: ${moy((r) => r.combats[v])}  défaites arène: ${moy((r) => r.defaitesArene[v])}  niveaux à la victoire: ${tout.slice(0, 5).map((r) => r.niveauArene[v]).join(' | ')}`)
}
console.log('parties bloquées', tout.filter((r) => r.bloque).length, ' défaites totales', moy((r) => r.defaites), ' or final', moy((r) => r.or))
