// Moteur de combat au tour par tour.
// Toutes les fonctions modifient l'état `b` reçu (une copie, côté interface)
// et renvoient la liste des événements à animer.

import { CLASSES } from '../data/heroes.js'
import { MONSTRES, statsMonstre } from '../data/monsters.js'
import { CONSOMMABLES } from '../data/items.js'
import { efficacite, TYPES } from '../data/types.js'
import { competencesConnues } from './heroes.js'

const FACTEUR_MONSTRES = 1.25
const DEFENSE_POSTURE = 1.6

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
      stats: { atq: h.stats.atq, mag: h.stats.mag, def: h.stats.def, vit: h.stats.vit, crit: h.stats.crit || 5 },
      elem: h.stats.elem || {},
      competences: competencesConnues(h).map((x) => x.id),
      pv: Math.max(0, Math.min(h.pv, h.stats.pv)),
      pm: Math.min(h.pm, h.stats.pm),
      buffs: [], brulure: 0, etourdi: false, provoc: 0, defend: false, tours: 0,
    })
  }
  ennemis.forEach((e, i) => units.push(uniteMonstre(e.id, e.niveau, 'm' + i)))
  const b = { units, file: [], tour: 0, actif: null, fini: null, boss, sac: { ...sac }, flags: {}, compteurInvoc: ennemis.length }
  for (const u of units) u.ko = u.pv <= 0
  return b
}

function uniteMonstre(id, niveau, uid) {
  const m = MONSTRES[id]
  const s = statsMonstre(id, niveau)
  return {
    uid, camp: 'm', monstre: id, nom: m.nom, image: m.image, type: m.type, niveau, boss: !!m.boss,
    max: { pv: s.pv, pm: 0 },
    stats: { atq: s.atq, mag: s.mag, def: s.def, vit: s.vit, crit: 5 },
    elem: {}, pv: s.pv, pm: 0,
    buffs: [], brulure: 0, etourdi: false, provoc: 0, defend: false, tours: 0, ko: false,
  }
}

export const unite = (b, uid) => b.units.find((u) => u.uid === uid)
export const vivants = (b, camp) => b.units.filter((u) => u.camp === camp && !u.ko)
export const actif = (b) => (b.actif ? unite(b, b.actif) : null)

function multBuff(u, stat) {
  return u.buffs.filter((x) => x.stat === stat).reduce((m, x) => m * x.mult, 1)
}

// ── Déroulement ──────────────────────────────────────────────

// Passe au combattant suivant. Gère l'étourdissement (tour sauté).
// Renvoie { unite, evenements }. Si unite est null, le combat est fini.
export function avancer(b) {
  const ev = []
  for (let garde = 0; garde < 50; garde++) {
    if (verifierFin(b)) return { unite: null, evenements: ev }
    if (!b.file.length) {
      b.tour += 1
      b.file = b.units
        .filter((u) => !u.ko)
        .map((u) => ({ uid: u.uid, v: u.stats.vit * multBuff(u, 'vit') * (0.9 + Math.random() * 0.2) }))
        .sort((x, y) => y.v - x.v)
        .map((x) => x.uid)
      // Les champions d'arène agissent deux fois par tour : une fois à leur
      // place, une fois en fin de tour.
      for (const u of b.units) if (u.boss && !u.ko) b.file.push(u.uid)
    }
    const uid = b.file.shift()
    const u = unite(b, uid)
    if (!u || u.ko) continue
    b.actif = uid
    u.defend = false
    if (u.etourdi) {
      u.etourdi = false
      ev.push({ t: 'statut', cible: uid, texte: `${u.nom} est étourdi et passe son tour !` })
      ev.push(...finTour(b))
      continue
    }
    return { unite: u, evenements: ev }
  }
  return { unite: null, evenements: ev }
}

function finTour(b) {
  const ev = []
  const u = actif(b)
  if (!u) return ev
  u.tours += 1
  if (!u.ko && u.brulure > 0) {
    const d = Math.max(1, Math.round(u.max.pv * 0.07))
    u.pv = Math.max(0, u.pv - d)
    u.brulure -= 1
    ev.push({ t: 'degats', cible: u.uid, valeur: d, brulure: true, texte: `${u.nom} souffre de sa brûlure.` })
    if (u.pv <= 0) ev.push(...mettreKo(b, u))
  }
  u.buffs = u.buffs.map((x) => ({ ...x, tours: x.tours - 1 })).filter((x) => x.tours > 0)
  if (u.provoc > 0) u.provoc -= 1
  verifierFin(b)
  return ev
}

function mettreKo(b, u) {
  u.ko = true
  u.pv = 0
  u.brulure = 0
  u.buffs = []
  u.provoc = 0
  b.file = b.file.filter((x) => x !== u.uid)
  return [{ t: 'ko', cible: u.uid, texte: u.camp === 'h' ? `${u.nom} est K.O. !` : `${u.nom} est vaincu !` }]
}

function verifierFin(b) {
  if (b.fini) return true
  if (!vivants(b, 'm').length) b.fini = 'victoire'
  else if (!vivants(b, 'h').length) b.fini = 'defaite'
  return !!b.fini
}

// ── Calculs ──────────────────────────────────────────────────

export function calculerDegats(att, def, comp) {
  const stat = comp.stat || 'atq'
  const a = att.stats[stat] * multBuff(att, stat)
  const d = def.stats.def * multBuff(def, 'def') * (def.defend ? DEFENSE_POSTURE : 1)
  const type = comp.type || 'neutre'
  const mult = efficacite(type, def.type)
  const bonusElem = 1 + (att.elem?.[type] || 0) / 100
  const crit = Math.random() * 100 < att.stats.crit + (comp.crit || 0)
  let v = a * (comp.puissance / 100) * (42 / (42 + d)) * mult * bonusElem * (crit ? 1.6 : 1) * (0.9 + Math.random() * 0.2)
  if (att.camp === 'm') v *= FACTEUR_MONSTRES
  return { valeur: Math.max(1, Math.round(v)), crit, mult }
}

function appliquerAttaque(b, att, cibles, comp) {
  const ev = []
  for (const c of cibles) {
    for (let i = 0; i < (comp.coups || 1); i++) {
      if (c.ko) break
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
    if (e.kind === 'etourdi') {
      const chance = c.boss ? e.chance * 0.4 : e.chance
      if (Math.random() < chance && !c.ko) {
        c.etourdi = true
        ev.push({ t: 'statut', cible: c.uid, texte: `${c.nom} est étourdi !` })
      }
    } else if (e.kind === 'brulure') {
      if (c.type !== 'feu' && Math.random() < e.chance && !c.ko) {
        c.brulure = Math.max(c.brulure, e.tours)
        ev.push({ t: 'statut', cible: c.uid, texte: `${c.nom} est brûlé !` })
      }
    } else if (e.kind === 'soin' && !apresAttaque) {
      if (c.ko) continue
      const v = Math.round(att.stats.mag * (e.puissance / 100) * 1.1 + 8)
      const reel = Math.min(v, c.max.pv - c.pv)
      c.pv += reel
      ev.push({ t: 'soin', cible: c.uid, valeur: reel })
    } else if (e.kind === 'buff' && !c.ko) {
      c.buffs.push({ stat: e.stat, mult: e.mult, tours: e.tours + (c.uid === att.uid ? 1 : 0) })
      const nom = { def: 'défense', atq: 'attaque', mag: 'magie', vit: 'vitesse' }[e.stat]
      ev.push({ t: 'statut', cible: c.uid, texte: `La ${nom} de ${c.nom} augmente !`, buff: true })
    } else if (e.kind === 'provoc' && !c.ko) {
      c.provoc = e.tours + 1
      ev.push({ t: 'statut', cible: c.uid, texte: `${c.nom} attire l'attention des ennemis !`, buff: true })
    }
  }
  return ev
}

function resoudreCibles(b, lanceur, comp, cibleUid) {
  const adverse = lanceur.camp === 'h' ? 'm' : 'h'
  const allie = lanceur.camp
  switch (comp.cible || 'ennemi') {
    case 'ennemis': return vivants(b, adverse)
    case 'allies': return vivants(b, allie)
    case 'soi': return [lanceur]
    case 'allie': {
      const c = unite(b, cibleUid)
      return c && c.camp === allie && !c.ko ? [c] : [lanceur]
    }
    default: {
      const c = unite(b, cibleUid)
      if (c && c.camp === adverse && !c.ko) return [c]
      const v = vivants(b, adverse)
      return v.length ? [v[0]] : []
    }
  }
}

function utiliserCompetence(b, lanceur, comp, cibleUid) {
  const ev = [{ t: 'action', source: lanceur.uid, nom: comp.nom, type: comp.type }]
  const cibles = resoudreCibles(b, lanceur, comp, cibleUid)
  if (comp.puissance) ev.push(...appliquerAttaque(b, lanceur, cibles, comp))
  else for (const c of cibles) ev.push(...appliquerEffets(b, lanceur, c, comp.effets || []))
  return ev
}

// ── Actions du joueur ───────────────────────────────────────

export function competenceParId(classe, id) {
  return CLASSES[classe].competences.find((c) => c.id === id)
}

export function agir(b, action) {
  const u = actif(b)
  if (!u || u.camp !== 'h' || b.fini) return []
  const ev = []
  if (action.kind === 'attaque') {
    ev.push(...utiliserCompetence(b, u, { ...CLASSES[u.classe].attaque, cible: 'ennemi' }, action.cible))
  } else if (action.kind === 'competence') {
    const comp = competenceParId(u.classe, action.id)
    if (!comp || u.pm < comp.cout) return []
    u.pm -= comp.cout
    ev.push(...utiliserCompetence(b, u, comp, action.cible))
  } else if (action.kind === 'objet') {
    const o = CONSOMMABLES[action.id]
    if (!o || !(b.sac[action.id] > 0)) return []
    const c = unite(b, action.cible) || u
    if (o.effet.reanime && !c.ko) return []
    if (!o.effet.reanime && c.ko) return []
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
  } else if (action.kind === 'fuir') {
    if (b.boss) return []
    ev.push({ t: 'action', source: u.uid, nom: 'Fuite' })
    if (Math.random() < 0.75) {
      b.fini = 'fuite'
      ev.push({ t: 'texte', texte: 'L\'équipe prend la poudre d\'escampette !' })
      return ev
    }
    ev.push({ t: 'texte', texte: 'Impossible de fuir !' })
  }
  ev.push(...finTour(b))
  return ev
}

// ── Intelligence des monstres ───────────────────────────────

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
  if (m.script === 'champignard' && u.tours % 3 === 2) {
    return utiliserCompetence(b, u, { nom: 'Pluie de spores', type: 'plante', puissance: 60, stat: 'mag', cible: 'ennemis', effets: [{ kind: 'etourdi', chance: 0.2 }] })
  }
  if (m.script === 'bulle' && !b.flags.equipage && u.pv < u.max.pv * 0.5) {
    b.flags.equipage = true
    const ev = [{ t: 'action', source: u.uid, nom: 'À moi, l\'équipage !' }]
    const uid = 'm' + b.compteurInvoc++
    const crabe = uniteMonstre('crabouille', Math.max(1, u.niveau - 2), uid)
    b.units.push(crabe)
    ev.push({ t: 'invoque', cible: uid, texte: 'Un Crabouille arrive en renfort !' })
    return ev
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

export function tourMonstre(b) {
  const u = actif(b)
  if (!u || u.camp !== 'm' || b.fini) return []
  let ev = u.boss ? scriptBoss(b, u) : null
  if (!ev) {
    const m = MONSTRES[u.monstre]
    const possibles = m.attaques.filter((a) => !a.seulementSiBlesse || u.pv < u.max.pv * 0.6)
    const total = possibles.reduce((s, a) => s + a.poids, 0)
    let r = Math.random() * total
    let att = possibles[0]
    for (const a of possibles) {
      r -= a.poids
      if (r <= 0) { att = a; break }
    }
    const cible = (att.cible || 'ennemi') === 'ennemi' ? choisirCibleHeros(b) : null
    ev = utiliserCompetence(b, u, att, cible?.uid)
  }
  return [...ev, ...finTour(b)]
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
