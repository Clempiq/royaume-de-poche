// Moteur de combat en deux phases, façon tactique :
//  1. phase des héros : le joueur fait agir ses 3 héros dans l'ordre qu'il veut ;
//  2. phase des monstres : chacun agit (les champions deux fois).
// Les fonctions modifient l'état `b` reçu et renvoient les événements à animer.

import { CLASSES } from '../data/heroes.js'
import { MONSTRES, statsMonstre } from '../data/monsters.js'
import { CONSOMMABLES } from '../data/items.js'
import { efficacite, TYPES } from '../data/types.js'

const FACTEUR_MONSTRES = 1.25
const DEFENSE_POSTURE = 1.6
const REGEN_PM = 2

export function creerCombat({ heros, ennemis, boss = false, sac = {} }) {
  const units = []
  for (const h of heros) {
    const c = CLASSES[h.classe]
    units.push({
      uid: 'h-' + h.classe,
      camp: 'h',
      classe: h.classe,
      nom: c.prenom,
      image: c.image,
      type: null,
      niveau: h.niveau,
      max: { pv: h.stats.pv, pm: h.stats.pm },
      stats: { atq: h.stats.atq, mag: h.stats.mag, def: h.stats.def, vit: h.stats.vit, crit: h.stats.crit || 5, puiss: h.stats.puiss || 0 },
      elem: h.stats.elem || {},
      typeArme: h.stats.typeArme || 'neutre',
      capacites: (h.capacites || []).slice(),
      pv: Math.max(0, Math.min(h.pv, h.stats.pv)),
      pm: Math.min(h.pm, h.stats.pm),
      buffs: [], brulure: 0, etourdi: false, provoc: 0, defend: false,
    })
  }
  ennemis.forEach((e, i) => units.push(uniteMonstre(e.id, e.niveau, 'm' + i)))
  for (const u of units) u.ko = u.pv <= 0
  return { units, tour: 1, phase: 'joueur', aAgi: [], fini: null, boss, sac: { ...sac }, flags: {}, compteurInvoc: ennemis.length }
}

function uniteMonstre(id, niveau, uid) {
  const m = MONSTRES[id]
  const s = statsMonstre(id, niveau)
  return {
    uid, camp: 'm', monstre: id, nom: m.nom, image: m.image, type: m.type, niveau, boss: !!m.boss,
    max: { pv: s.pv, pm: 0 },
    stats: { atq: s.atq, mag: s.mag, def: s.def, vit: s.vit, crit: 5, puiss: 0 },
    elem: {}, pv: s.pv, pm: 0,
    buffs: [], brulure: 0, etourdi: false, provoc: 0, defend: false, ko: false, actions: 0,
  }
}

export const unite = (b, uid) => b.units.find((u) => u.uid === uid)
export const vivants = (b, camp) => b.units.filter((u) => u.camp === camp && !u.ko)
export const herosDisponibles = (b) => vivants(b, 'h').filter((u) => !b.aAgi.includes(u.uid))

function multBuff(u, stat) {
  return u.buffs.filter((x) => x.stat === stat).reduce((m, x) => m * x.mult, 1)
}

function verifierFin(b) {
  if (b.fini) return true
  if (!vivants(b, 'm').length) b.fini = 'victoire'
  else if (!vivants(b, 'h').length) b.fini = 'defaite'
  return !!b.fini
}

function mettreKo(b, u) {
  u.ko = true
  u.pv = 0
  u.brulure = 0
  u.buffs = []
  u.provoc = 0
  u.etourdi = false
  return [{ t: 'ko', cible: u.uid, texte: u.camp === 'h' ? `${u.nom} est K.O. !` : `${u.nom} est vaincu !` }]
}

// ── Capacités ───────────────────────────────────────────────

export function attaqueDeBase(u) {
  const a = CLASSES[u.classe].attaque
  return { id: 'base', nom: a.nom, type: u.typeArme || 'neutre', puissance: a.puissance, stat: a.stat, cible: 'ennemi', cout: 0 }
}

export function capacite(u, id) {
  if (id === 'base') return attaqueDeBase(u)
  return CLASSES[u.classe].competences.find((c) => c.id === id)
}

// ── Calculs ─────────────────────────────────────────────────

function valeurAttaque(att, comp) {
  const stat = comp.stat || 'atq'
  return att.stats[stat] * multBuff(att, stat) + (att.camp === 'h' ? att.stats.puiss || 0 : 0)
}

export function calculerDegats(att, def, comp, { hasard = true } = {}) {
  const a = valeurAttaque(att, comp)
  const d = def.stats.def * multBuff(def, 'def') * (def.defend ? DEFENSE_POSTURE : 1)
  const type = comp.type || 'neutre'
  const mult = efficacite(type, def.type)
  const bonusElem = 1 + (att.elem?.[type] || 0) / 100
  const crit = hasard && Math.random() * 100 < att.stats.crit + (comp.crit || 0)
  let v = a * (comp.puissance / 100) * (42 / (42 + d)) * mult * bonusElem * (crit ? 1.6 : 1)
  if (hasard) v *= 0.9 + Math.random() * 0.2
  if (att.camp === 'm') v *= FACTEUR_MONSTRES
  return { valeur: Math.max(1, Math.round(v)), crit, mult }
}

// Aperçu affiché au joueur avant de choisir sa cible
export function estimer(b, uid, comp, cibleUid) {
  const att = unite(b, uid)
  const c = unite(b, cibleUid)
  if (!att || !c || !comp.puissance) return null
  const { valeur, mult } = calculerDegats(att, c, comp, { hasard: false })
  const total = valeur * (comp.coups || 1)
  return { min: Math.max(1, Math.round(total * 0.9)), max: Math.round(total * 1.1), mult, ko: total * 0.9 >= c.pv }
}

function chanceEsquive(att, def) {
  const base = 0.03 + Math.max(0, def.stats.vit - att.stats.vit) * 0.008
  return Math.min(def.boss ? 0.05 : 0.2, base)
}

function appliquerAttaque(b, att, cibles, comp) {
  const ev = []
  for (const c of cibles) {
    for (let i = 0; i < (comp.coups || 1); i++) {
      if (c.ko) break
      if (Math.random() < chanceEsquive(att, c)) {
        ev.push({ t: 'esquive', cible: c.uid, texte: `${c.nom} esquive !` })
        continue
      }
      const { valeur, crit, mult } = calculerDegats(att, c, comp)
      c.pv = Math.max(0, c.pv - valeur)
      ev.push({ t: 'degats', source: att.uid, cible: c.uid, valeur, crit, mult, type: comp.type || 'neutre' })
      if (c.pv <= 0) {
        ev.push(...mettreKo(b, c))
        break
      }
    }
    if (!c.ko) ev.push(...appliquerEffets(b, att, c, comp.effets || [], true))
  }
  return ev
}

function appliquerEffets(b, att, c, effets, apresAttaque = false) {
  const ev = []
  for (const e of effets) {
    if (c.ko) break
    if (e.kind === 'etourdi') {
      const chance = c.boss ? e.chance * 0.4 : e.chance
      if (Math.random() < chance) {
        c.etourdi = true
        ev.push({ t: 'statut', cible: c.uid, texte: `${c.nom} est étourdi !` })
      }
    } else if (e.kind === 'brulure') {
      if (c.type !== 'feu' && Math.random() < e.chance) {
        c.brulure = Math.max(c.brulure, e.tours)
        ev.push({ t: 'statut', cible: c.uid, texte: `${c.nom} est brûlé !` })
      }
    } else if (e.kind === 'soin' && !apresAttaque) {
      const v = Math.round(att.stats.mag * (e.puissance / 100) * 1.1 + (att.stats.puiss || 0) * 0.5 + 8)
      const reel = Math.min(v, c.max.pv - c.pv)
      c.pv += reel
      ev.push({ t: 'soin', cible: c.uid, valeur: reel })
    } else if (e.kind === 'buff') {
      c.buffs.push({ stat: e.stat, mult: e.mult, tours: e.tours })
      const nom = { def: 'défense', atq: 'attaque', mag: 'magie', vit: 'vitesse' }[e.stat]
      ev.push({ t: 'statut', cible: c.uid, texte: `La ${nom} de ${c.nom} augmente !`, buff: true })
    } else if (e.kind === 'provoc') {
      c.provoc = e.tours
      ev.push({ t: 'statut', cible: c.uid, texte: `${c.nom} attire l'attention des ennemis !`, buff: true })
    }
  }
  return ev
}

function resoudreCibles(b, lanceur, comp, cibleUid) {
  const adverse = lanceur.camp === 'h' ? 'm' : 'h'
  switch (comp.cible || 'ennemi') {
    case 'ennemis': return vivants(b, adverse)
    case 'allies': return vivants(b, lanceur.camp)
    case 'soi': return [lanceur]
    case 'allie': {
      const c = unite(b, cibleUid)
      return c && c.camp === lanceur.camp && !c.ko ? [c] : [lanceur]
    }
    default: {
      const c = unite(b, cibleUid)
      if (c && c.camp === adverse && !c.ko) return [c]
      const v = vivants(b, adverse)
      return v.length ? [v[0]] : []
    }
  }
}

function utiliser(b, lanceur, comp, cibleUid) {
  const ev = [{ t: 'action', source: lanceur.uid, nom: comp.nom, type: comp.type }]
  const cibles = resoudreCibles(b, lanceur, comp, cibleUid)
  if (comp.puissance) ev.push(...appliquerAttaque(b, lanceur, cibles, comp))
  else for (const c of cibles) ev.push(...appliquerEffets(b, lanceur, c, comp.effets || []))
  return ev
}

function brulure(b, u) {
  if (u.ko || u.brulure <= 0) return []
  const d = Math.max(1, Math.round(u.max.pv * 0.07))
  u.pv = Math.max(0, u.pv - d)
  u.brulure -= 1
  const ev = [{ t: 'degats', cible: u.uid, valeur: d, brulure: true, texte: `${u.nom} souffre de sa brûlure.` }]
  if (u.pv <= 0) ev.push(...mettreKo(b, u))
  return ev
}

function userBuffs(u) {
  u.buffs = u.buffs.map((x) => ({ ...x, tours: x.tours - 1 })).filter((x) => x.tours > 0)
  if (u.provoc > 0) u.provoc -= 1
}

// ── Phase des héros ─────────────────────────────────────────

export function agir(b, uid, action) {
  const u = unite(b, uid)
  if (!u || u.camp !== 'h' || u.ko || b.fini || b.phase !== 'joueur' || b.aAgi.includes(uid)) return []
  const ev = []
  if (action.kind === 'capacite') {
    const comp = capacite(u, action.id)
    if (!comp || u.pm < (comp.cout || 0)) return []
    u.pm -= comp.cout || 0
    ev.push(...utiliser(b, u, comp, action.cible))
  } else if (action.kind === 'objet') {
    const o = CONSOMMABLES[action.id]
    if (!o || !(b.sac[action.id] > 0)) return []
    const c = unite(b, action.cible) || u
    if (o.effet.reanime ? !c.ko : c.ko) return []
    b.sac[action.id] -= 1
    ev.push({ t: 'action', source: u.uid, nom: o.nom, objet: true })
    if (o.effet.reanime) {
      c.ko = false
      c.pv = Math.round(c.max.pv * o.effet.reanime)
      ev.push({ t: 'soin', cible: c.uid, valeur: c.pv, texte: `${c.nom} se relève !`, reanime: true })
    }
    if (o.effet.pv) {
      const r = Math.min(o.effet.pv, c.max.pv - c.pv)
      c.pv += r
      ev.push({ t: 'soin', cible: c.uid, valeur: r })
    }
    if (o.effet.pm) {
      const r = Math.min(o.effet.pm, c.max.pm - c.pm)
      c.pm += r
      ev.push({ t: 'pm', cible: c.uid, valeur: r })
    }
    if (o.effet.soigneBrulure && c.brulure) {
      c.brulure = 0
      ev.push({ t: 'statut', cible: c.uid, texte: `${c.nom} n'est plus brûlé.` })
    }
  } else if (action.kind === 'defendre') {
    u.defend = true
    const r = Math.min(3, u.max.pm - u.pm)
    u.pm += r
    ev.push({ t: 'action', source: u.uid, nom: 'En garde' })
    ev.push({ t: 'statut', cible: u.uid, texte: `${u.nom} se met en garde${r ? ` et récupère ${r} PM` : ''}.`, buff: true })
  } else return []
  b.aAgi.push(uid)
  verifierFin(b)
  return ev
}

export function fuir(b) {
  if (b.boss || b.fini) return []
  if (Math.random() < 0.75) {
    b.fini = 'fuite'
    return [{ t: 'texte', texte: 'L\'équipe prend la poudre d\'escampette !' }]
  }
  b.aAgi = vivants(b, 'h').map((u) => u.uid)
  return [{ t: 'texte', texte: 'Impossible de fuir ! Les monstres en profitent.' }]
}

// ── Phase des monstres ──────────────────────────────────────

function choisirCibleHeros(b) {
  const h = vivants(b, 'h')
  const provoc = h.find((x) => x.provoc > 0)
  if (provoc && Math.random() < 0.8) return provoc
  const poids = h.map((x) => [x, 1 + (1 - x.pv / x.max.pv) * 1.2])
  const tot = poids.reduce((s, [, p]) => s + p, 0)
  let r = Math.random() * tot
  for (const [x, p] of poids) {
    r -= p
    if (r <= 0) return x
  }
  return h[0]
}

function scriptBoss(b, u) {
  const m = MONSTRES[u.monstre]
  if (m.script === 'champignard' && u.actions % 3 === 2) {
    return utiliser(b, u, { nom: 'Pluie de spores', type: 'plante', puissance: 60, stat: 'mag', cible: 'ennemis', effets: [{ kind: 'etourdi', chance: 0.2 }] })
  }
  if (m.script === 'bulle' && !b.flags.equipage && u.pv < u.max.pv * 0.5) {
    b.flags.equipage = true
    const uid = 'm' + b.compteurInvoc++
    b.units.push(uniteMonstre('crabouille', Math.max(1, u.niveau - 2), uid))
    return [{ t: 'action', source: u.uid, nom: 'À moi, l\'équipage !' }, { t: 'invoque', cible: uid, texte: 'Un Crabouille arrive en renfort !' }]
  }
  if (m.script === 'magma' && !b.flags.obsidienne && u.pv < u.max.pv * 0.5) {
    b.flags.obsidienne = true
    u.type = 'roche'
    u.buffs.push({ stat: 'def', mult: 1.3, tours: 99 })
    return [
      { t: 'action', source: u.uid, nom: 'Peau d\'obsidienne' },
      { t: 'type', cible: u.uid, type: 'roche', texte: `La peau de la Reine Magma durcit ! Elle devient de type ${TYPES.roche.nom}.` },
    ]
  }
  return null
}

function actionMonstre(b, u) {
  u.actions += 1
  let ev = u.boss ? scriptBoss(b, u) : null
  if (!ev) {
    const m = MONSTRES[u.monstre]
    const possibles = m.attaques.filter((a) => !a.seulementSiBlesse || u.pv < u.max.pv * 0.6)
    let r = Math.random() * possibles.reduce((s, a) => s + a.poids, 0)
    let att = possibles[0]
    for (const a of possibles) {
      r -= a.poids
      if (r <= 0) { att = a; break }
    }
    const cible = (att.cible || 'ennemi') === 'ennemi' ? choisirCibleHeros(b) : null
    ev = utiliser(b, u, att, cible?.uid)
  }
  return ev
}

// Joue toute la phase des monstres puis prépare le tour suivant
export function phaseMonstres(b) {
  if (b.fini) return []
  b.phase = 'monstres'
  const ev = []
  for (const u of vivants(b, 'm')) ev.push(...brulure(b, u))
  if (verifierFin(b)) return ev
  const ordre = vivants(b, 'm').sort((x, y) => y.stats.vit * multBuff(y, 'vit') - x.stats.vit * multBuff(x, 'vit'))
  // Les champions agissent une seconde fois en fin de phase
  const file = [...ordre.map((u) => u.uid), ...ordre.filter((u) => u.boss).map((u) => u.uid)]
  for (const uid of file) {
    const u = unite(b, uid)
    if (!u || u.ko) continue
    if (u.etourdi) {
      u.etourdi = false
      ev.push({ t: 'statut', cible: u.uid, texte: `${u.nom} est étourdi et ne bouge pas !` })
      continue
    }
    ev.push(...actionMonstre(b, u))
    if (verifierFin(b)) return ev
  }
  for (const u of vivants(b, 'm')) userBuffs(u)
  ev.push(...debutPhaseJoueur(b))
  return ev
}

function debutPhaseJoueur(b) {
  const ev = []
  b.tour += 1
  b.phase = 'joueur'
  b.aAgi = []
  for (const u of vivants(b, 'h')) {
    u.defend = false
    userBuffs(u)
    u.pm = Math.min(u.max.pm, u.pm + REGEN_PM)
    ev.push(...brulure(b, u))
  }
  for (const u of vivants(b, 'h')) {
    if (u.etourdi) {
      u.etourdi = false
      b.aAgi.push(u.uid)
      ev.push({ t: 'statut', cible: u.uid, texte: `${u.nom} est étourdi et passe ce tour.` })
    }
  }
  verifierFin(b)
  return ev
}

// Résumé à rendre au jeu une fois le combat fini
export function bilanCombat(b) {
  return {
    issue: b.fini,
    heros: b.units.filter((u) => u.camp === 'h').map((u) => ({ classe: u.classe, pv: u.pv, pm: u.pm, ko: u.ko })),
    vaincus: b.units.filter((u) => u.camp === 'm' && u.ko).map((u) => ({ id: u.monstre, niveau: u.niveau })),
    sac: b.sac,
  }
}
