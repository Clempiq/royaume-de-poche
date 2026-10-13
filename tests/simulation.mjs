// Simule des parties complètes avec l'IA pour vérifier l'équilibrage.
// Usage : node tests/simulation.mjs [nombre de parties]
// L'IA suit le parcours de chaque ville, puis la route jusqu'à la suivante.
// Après une défaite, elle s'entraîne un peu en chasse libre avant de réessayer.
import { creerCombat, bilanCombat, EQUILIBRAGE } from '../src/engine/battle.js'
for (const k of Object.keys(EQUILIBRAGE)) if (process.env[k]) EQUILIBRAGE[k] = Number(process.env[k])
if (process.env.MULT_XP) G.REGLAGES.multXp = Number(process.env.MULT_XP)
import * as G from '../src/engine/game.js'
import { VILLES, ORDRE_VILLES } from '../src/data/world.js'
import { ORDRE_EQUIPE } from '../src/data/heroes.js'
import { statsObjet } from '../src/engine/loot.js'
import { statsHeros } from '../src/engine/heroes.js'
import { jouerCombat } from '../src/engine/ia.js'

const valeur = (o) => Object.entries(statsObjet(o)).reduce((s, [k, v]) => s + v * (k === 'pv' ? 0.25 : k === 'puiss' ? 1.5 : 1), 0) + Object.values(o.elem).reduce((s, v) => s + v * 0.1, 0) + (o.pouvoir ? 30 : 0)

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

function soignerAuxPotions(s) {
  for (const c of ORDRE_EQUIPE) {
    const h = s.heros[c]
    const st = statsHeros(h, s.inventaire)
    for (const id of ['superpotion', 'potion']) {
      while (h.pv > 0 && h.pv < st.pv * 0.5 && s.sac[id] > 0) G.utiliserConsommable(s, id, c)
    }
    if (h.pv <= 0 && s.sac.plume > 0) G.utiliserConsommable(s, 'plume', c)
  }
}

function combat(s, ennemis, contexte, res) {
  const b = creerCombat({ heros: G.herosPourCombat(s), ennemis, boss: ennemis.some((e) => e.id && ['champignard', 'bulle', 'magma'].includes(e.id)), sac: s.sac })
  jouerCombat(b)
  const bilan = bilanCombat(b)
  const r = G.finCombat(s, bilan, contexte)
  res.combats++
  if (r.issue === 'defaite') res.defaites++
  return { r, tours: bilan.tours }
}

// Investit l'or dans le village (si VILLAGE=1), chantiers terminés aussitôt
function investir(s) {
  if (!process.env.VILLAGE) return
  for (let i = 0; i < 20; i++) {
    const options = ['chateau', 'caserne', 'remparts', 'bibliotheque', 'forge'].filter((k) => G.peutAmeliorer(s, k).ok)
    if (!options.length) break
    G.ameliorer(s, options[0])
    for (const c of s.camp.chantiers) c.fin = 0
    G.tic(s)
  }
}

function preparer(s) {
  investir(s)
  G.seReposer(s)
  G.prendreRepas(s, 'croissant')
  equiperMieux(s)
  while (s.or > 150 && (s.sac.potion || 0) < 5) G.acheterConsommable(s, 'potion')
}

// Joue un parcours jusqu'au bout ; renvoie false si bloqué
function jouerParcours(s, cle, res, seg) {
  for (let essais = 0; essais < 60; essais++) {
    const c = G.caseCourante(s, cle)
    if (!c || c.t === 'arrivee') return true
    if (c.t === 'feu') { G.feuDeCamp(s, cle); continue }
    // L'arène est en ville : on passe à l'auberge avant d'y entrer
    if (c.t === 'champion') {
      preparer(s)
      if (!res.niveauAvant[seg]) res.niveauAvant[seg] = ORDRE_EQUIPE.map((k) => s.heros[k].niveau).join('/')
    }
    soignerAuxPotions(s)
    const { r, tours } = combat(s, G.ennemisCase(s, cle), { type: 'parcours', cle }, res)
    if (c.t === 'champion' && r.issue === 'victoire') {
      res.niveaux[seg] = ORDRE_EQUIPE.map((k) => s.heros[k].niveau).join('/')
      res.toursChampion[seg] = tours
    }
    if (r.issue === 'defaite') {
      res.defaitesSeg[seg] = (res.defaitesSeg[seg] || 0) + 1
      if (c.t === 'champion') res.defaitesChampion[seg] = (res.defaitesChampion[seg] || 0) + 1
      // Un peu de chasse libre pour se renforcer (pas sur la route)
      for (let i = 0; i < 2 && cle !== 'route'; i++) {
        preparer(s)
        combat(s, G.rencontreSauvage(s), { type: 'chasse' }, res)
        res.chasse[seg] = (res.chasse[seg] || 0) + 1
      }
      if (cle !== 'route') preparer(s)
      else { G.seReposer(s); equiperMieux(s) }
    }
  }
  return false
}

function partie() {
  const s = G.nouvellePartie()
  const res = { niveauAvant: {}, combats: 0, defaites: 0, niveaux: {}, toursChampion: {}, defaitesSeg: {}, defaitesChampion: {}, chasse: {} }
  for (const v of ORDRE_VILLES) {
    preparer(s)
    if (!jouerParcours(s, v, res, v) || !s.eclats.includes(VILLES[v].arene.boss)) { res.bloque = v; break }
    if (VILLES[v].suivante) {
      preparer(s)
      G.partirEnVoyage(s)
      if (!jouerParcours(s, 'route', res, 'route>' + VILLES[v].suivante)) { res.bloque = 'route>' + v; break }
      G.arriver(s)
      res.arrivee = (res.arrivee || 0) + (s.voyage ? 0 : 1)
    }
  }
  res.or = s.or
  res.niveauFinal = ORDRE_EQUIPE.map((k) => s.heros[k].niveau).join('/')
  return res
}

const n = Number(process.argv[2] || 20)
const tout = Array.from({ length: n }, partie)
const moy = (f) => (tout.reduce((t, r) => t + (f(r) || 0), 0) / n).toFixed(1)
for (const seg of ['brioche', 'route>gougere', 'gougere', 'route>cramoisi', 'cramoisi']) {
  const champion = !seg.startsWith('route')
  console.log(`${seg.padEnd(15)} défaites: ${moy((r) => r.defaitesSeg[seg])}${champion ? `  dont champion: ${moy((r) => r.defaitesChampion[seg])}  tours champion: ${moy((r) => r.toursChampion[seg])}  chasse: ${moy((r) => r.chasse[seg])}  arrivée au champion: ${tout.slice(0, 4).map((r) => r.niveauAvant[seg]).join(' | ')}  victoire: ${tout.slice(0, 4).map((r) => r.niveaux[seg]).join(' | ')}` : ''}`)
}
console.log('parties bloquées', tout.filter((r) => r.bloque).length, tout.filter((r) => r.bloque).map((r) => r.bloque).join(','), ' combats', moy((r) => r.combats), ' or final', moy((r) => r.or), ' niveau final', tout.slice(0, 5).map((r) => r.niveauFinal).join(' | '))
