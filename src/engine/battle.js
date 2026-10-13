// Moteur de combat en deux phases, façon tactique :
//  1. phase des héros : le joueur fait agir ses 3 héros dans l'ordre qu'il veut ;
//  2. phase des monstres : chacun agit (les champions deux fois).
//
// Les monstres annoncent leurs intentions : au début de chaque tour,
// chacun choisit son action et sa cible, et le joueur les voit avant de
// jouer. Rien n'est retiré au sort après coup. Les champions et les élites
// préparent une grosse attaque un tour à l'avance ; une interruption ou un
// étourdissement l'annule.
//
// Les fonctions modifient l'état `b` reçu et renvoient les événements à animer.

import { CLASSES } from '../data/heroes.js'
import { MONSTRES, statsMonstre } from '../data/monsters.js'
import { CONSOMMABLES } from '../data/items.js'
import { efficacite, TYPES } from '../data/types.js'

// Réglages d'équilibrage (modifiables par la simulation)
export const EQUILIBRAGE = { degatsMonstres: 1.45, pvMonstres: 1.3, pvChampions: 0.9 }
const DEFENSE_POSTURE = 1.6
const REGEN_PM = 2
export const FACTEUR_CHARGE = 2.2
export const BONUS_EXPOSE = 1.3
const RIPOSTE = 0.6
const ELITE = { pv: 1.8, degats: 1.25 }

export function creerCombat({ heros, ennemis, boss = false, sac = {}, regles = {} }) {
  const units = []
  for (const h of heros) {
    const c = CLASSES[h.classe]
    const pmMax = h.stats.pm
    units.push({
      uid: 'h-' + h.classe,
      camp: 'h',
      classe: h.classe,
      nom: c.prenom,
      image: c.image,
      type: null,
      niveau: h.niveau,
      max: { pv: h.stats.pv, pm: pmMax },
      stats: { atq: h.stats.atq, mag: h.stats.mag, def: h.stats.def, vit: h.stats.vit, crit: h.stats.crit || 5, puiss: h.stats.puiss || 0 },
      elem: h.stats.elem || {},
      typeArme: h.stats.typeArme || 'neutre',
      pouvoirs: h.stats.pouvoirs || [],
      capacites: (h.capacites || []).slice(),
      pv: Math.max(0, Math.min(h.pv, h.stats.pv)),
      pm: regles.pmMoitie ? Math.floor(Math.min(h.pm, pmMax) / 2) : Math.min(h.pm, pmMax),
      recharges: {},
      buffs: [], brulure: 0, etourdi: false, provoc: 0, riposte: 0, defend: false, expose: false,
    })
  }
  ennemis.forEach((e, i) => units.push(uniteMonstre(e.id, e.niveau, 'm' + i, !!e.elite)))
  for (const u of units) u.ko = u.pv <= 0
  const b = {
    units, tour: 1, phase: 'joueur', aAgi: [], fini: null, boss,
    sac: regles.sansObjets ? {} : { ...sac },
    regles, flags: {}, compteurInvoc: ennemis.length,
  }
  planifier(b)
  return b
}

function uniteMonstre(id, niveau, uid, elite = false) {
  const m = MONSTRES[id]
  const s = statsMonstre(id, niveau)
  const u = {
    uid, camp: 'm', monstre: id, nom: elite ? m.elite : m.nom, image: m.image, type: m.type, niveau, boss: !!m.boss, elite,
    max: { pv: s.pv, pm: 0 },
    stats: { atq: s.atq, mag: s.mag, def: s.def, vit: s.vit, crit: 5, puiss: 0 },
    elem: {}, pv: s.pv, pm: 0,
    buffs: [], brulure: 0, etourdi: false, provoc: 0, riposte: 0, defend: false, expose: false, ko: false, actions: 0,
    intentions: [], chargePrete: false, attCharge: null,
  }
  const pv = Math.round(s.pv * (m.boss ? EQUILIBRAGE.pvChampions : EQUILIBRAGE.pvMonstres))
  u.max.pv = u.pv = pv
  if (elite) {
    u.max.pv = u.pv = Math.round(pv * ELITE.pv)
    u.stats.atq = Math.round(s.atq * ELITE.degats)
    u.stats.mag = Math.round(s.mag * ELITE.degats)
    // L'élite charge sa meilleure attaque simple
    const simples = m.attaques.filter((a) => a.puissance && (a.cible || 'ennemi') === 'ennemi')
    const meilleure = simples.sort((a, c) => c.puissance - a.puissance)[0]
    if (meilleure) u.attCharge = { ...meilleure, nom: meilleure.nom + ' surpuissant', charge: true }
  }
  if (m.boss) u.attCharge = m.attaques.find((a) => a.charge) || null
  return u
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
  u.riposte = 0
  u.etourdi = false
  u.expose = false
  if (u.intentions) u.intentions = []
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

// Tours restants avant de pouvoir relancer une capacité (0 = disponible)
export const recharge = (u, id) => u.recharges?.[id] || 0

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
  const expose = att.camp === 'h' && def.expose ? BONUS_EXPOSE : 1
  let v = a * (comp.puissance / 100) * (42 / (42 + d)) * mult * bonusElem * expose * (crit ? 1.6 : 1)
  if (hasard) v *= 0.9 + Math.random() * 0.2
  if (att.camp === 'm') v *= EQUILIBRAGE.degatsMonstres
  return { valeur: Math.max(1, Math.round(v)), crit, mult }
}

// Aperçu affiché au joueur avant de choisir sa cible
export function estimer(b, uid, comp, cibleUid) {
  const att = unite(b, uid)
  const c = unite(b, cibleUid)
  if (!att || !c || !comp.puissance) return null
  const { valeur, mult } = calculerDegats(att, c, comp, { hasard: false })
  const total = valeur * (comp.coups || 1)
  return { min: Math.max(1, Math.round(total * 0.9)), max: Math.round(total * 1.1), mult, ko: total * 0.9 >= c.pv, expose: att.camp === 'h' && c.expose }
}

function chanceEsquive(att, def) {
  const base = 0.03 + Math.max(0, def.stats.vit - att.stats.vit) * 0.008
  return Math.min(def.boss ? 0.05 : 0.2, base)
}

const cibleUnique = (comp) => (comp.cible || 'ennemi') === 'ennemi'

function appliquerAttaque(b, att, cibles, comp) {
  const ev = []
  for (const c of cibles) {
    let touche = false
    for (let i = 0; i < (comp.coups || 1); i++) {
      if (c.ko) break
      if (Math.random() < chanceEsquive(att, c)) {
        ev.push({ t: 'esquive', cible: c.uid, texte: `${c.nom} esquive !` })
        continue
      }
      touche = true
      const { valeur, crit, mult } = calculerDegats(att, c, comp)
      c.pv = Math.max(0, c.pv - valeur)
      ev.push({ t: 'degats', source: att.uid, cible: c.uid, valeur, crit, mult, type: comp.type || 'neutre', expose: att.camp === 'h' && c.expose })
      if (c.pv <= 0) {
        ev.push(...mettreKo(b, c))
        break
      }
    }
    // L'ouverture est consommée par la première action alliée qui touche
    if (att.camp === 'h' && touche && c.expose) c.expose = false
    if (!c.ko) ev.push(...appliquerEffets(b, att, c, comp.effets || [], true))
    if (!c.ko && c.camp === 'm' && c.boss) ev.push(...seuilsBoss(b, c))
    if (touche && !c.ko && att.camp === 'm' && c.camp === 'h' && cibleUnique(comp) && !att.ko) ev.push(...riposter(b, c, att))
  }
  return ev
}

// Bastien contre-attaque : posture de riposte, ou Lame du Contre (une fois par tour)
function riposter(b, h, m) {
  const posture = h.riposte > 0
  const lame = h.pouvoirs?.includes('contre') && b.flags['contre-' + h.uid] !== b.tour
  if (!posture && !lame) return []
  if (!posture) b.flags['contre-' + h.uid] = b.tour
  const base = attaqueDeBase(h)
  const comp = { ...base, nom: 'Riposte', puissance: Math.round(base.puissance * RIPOSTE) }
  const { valeur, crit, mult } = calculerDegats(h, m, comp)
  m.pv = Math.max(0, m.pv - valeur)
  const ev = [
    { t: 'action', source: h.uid, nom: 'Riposte !', type: comp.type },
    { t: 'degats', source: h.uid, cible: m.uid, valeur, crit, mult, type: comp.type },
  ]
  if (m.pv <= 0) ev.push(...mettreKo(b, m))
  else if (m.boss) ev.push(...seuilsBoss(b, m))
  return ev
}

function annulerProchaine(b, u, raison) {
  const it = u.intentions?.find((x) => !x.faite && !x.annulee)
  if (!it) return []
  it.annulee = true
  if (it.genre === 'frappe') u.chargePrete = false
  return [{ t: 'statut', cible: u.uid, texte: `${u.nom} est ${raison} : ${it.att.nom} est annulé !`, interruption: true }]
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
    } else if (e.kind === 'interrompt') {
      if (c.camp === 'm') ev.push(...annulerProchaine(b, c, 'interrompu'))
    } else if (e.kind === 'expose') {
      c.expose = true
      ev.push({ t: 'statut', cible: c.uid, texte: `${c.nom} est exposé : la prochaine attaque sur lui fera +30 % !`, expose: true })
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
    } else if (e.kind === 'pm' && !apresAttaque) {
      const r = Math.min(e.valeur, c.max.pm - c.pm)
      c.pm += r
      ev.push({ t: 'pm', cible: c.uid, valeur: r })
    } else if (e.kind === 'purifie' && !apresAttaque) {
      if (c.brulure) {
        c.brulure = 0
        ev.push({ t: 'statut', cible: c.uid, texte: `${c.nom} n'est plus brûlé.` })
      }
    } else if (e.kind === 'buff') {
      c.buffs.push({ stat: e.stat, mult: e.mult, tours: e.tours })
      const nom = { def: 'défense', atq: 'attaque', mag: 'magie', vit: 'vitesse' }[e.stat]
      ev.push({ t: 'statut', cible: c.uid, texte: `La ${nom} de ${c.nom} augmente !`, buff: true })
    } else if (e.kind === 'provoc') {
      c.provoc = e.tours
      ev.push({ t: 'statut', cible: c.uid, texte: `${c.nom} attire toutes les attaques des ennemis !`, buff: true })
    } else if (e.kind === 'riposte') {
      c.riposte = e.tours
      ev.push({ t: 'statut', cible: c.uid, texte: `${c.nom} se tient prêt à riposter !`, buff: true })
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
  if (u.riposte > 0) u.riposte -= 1
}

// ── Intentions des monstres ─────────────────────────────────

const ESPACEMENT_CHARGE = 3

function intervalleCharge(b, u) {
  return u.boss && b.regles?.chargeRapide ? 2 : ESPACEMENT_CHARGE
}

// Héros visé par une attaque ciblée : celui qui provoque, sinon au hasard
// (les héros blessés attirent un peu plus les coups)
function cibleHeros(b) {
  const h = vivants(b, 'h')
  if (!h.length) return null
  const provoc = h.find((x) => x.provoc > 0)
  if (provoc) return provoc
  const poids = h.map((x) => [x, 1 + (1 - x.pv / x.max.pv) * 1.2])
  const tot = poids.reduce((s, [, p]) => s + p, 0)
  let r = Math.random() * tot
  for (const [x, p] of poids) {
    r -= p
    if (r <= 0) return x
  }
  return h[0]
}

function attaqueAuHasard(u) {
  const m = MONSTRES[u.monstre]
  const possibles = m.attaques.filter((a) => !a.charge && (!a.seulementSiBlesse || u.pv < u.max.pv * 0.6))
  let r = Math.random() * possibles.reduce((s, a) => s + a.poids, 0)
  for (const a of possibles) {
    r -= a.poids
    if (r <= 0) return a
  }
  return possibles[0]
}

function intention(b, att, genre = 'attaque') {
  const cible = (att.cible || 'ennemi') === 'ennemi' && genre !== 'prepare' ? cibleHeros(b)?.uid || null : null
  return { att, genre, cible, faite: false, annulee: false }
}

// Ce que le monstre fera ce tour : une action, deux pour un champion
function planifierUnite(b, u) {
  u.intentions = []
  if (u.ko) return
  const m = MONSTRES[u.monstre]
  if (u.chargePrete && u.attCharge) {
    u.chargePrete = false
    const frappe = { ...u.attCharge, puissance: Math.round(u.attCharge.puissance * FACTEUR_CHARGE) }
    u.intentions.push(intention(b, frappe, 'frappe'))
  } else if (u.attCharge && b.tour >= 2 && (b.tour - 2) % intervalleCharge(b, u) === 0) {
    u.intentions.push(intention(b, u.attCharge, 'prepare'))
  } else {
    u.intentions.push(intention(b, attaqueAuHasard(u)))
  }
  if (u.boss) {
    if (m.script === 'champignard' && b.tour % 2 === 1) {
      u.intentions.push(intention(b, { nom: 'Pluie de spores', type: 'plante', puissance: 55, stat: 'mag', cible: 'ennemis', effets: [{ kind: 'etourdi', chance: 0.2 }] }))
    } else {
      u.intentions.push(intention(b, attaqueAuHasard(u)))
    }
  }
}

export function planifier(b) {
  for (const u of vivants(b, 'm')) planifierUnite(b, u)
}

// Après chaque action : les attaques ciblées suivent la provocation,
// et une cible tombée K.O. est remplacée.
export function majIntentions(b) {
  const h = vivants(b, 'h')
  const provoc = h.find((x) => x.provoc > 0)
  for (const u of vivants(b, 'm')) {
    for (const it of u.intentions || []) {
      if (it.faite || it.annulee || !it.cible) continue
      const actuelle = unite(b, it.cible)
      if (provoc) it.cible = provoc.uid
      else if (!actuelle || actuelle.ko) it.cible = cibleHeros(b)?.uid || null
    }
  }
}

// Résumé lisible d'une intention, pour l'affichage
export function decrireIntention(b, u, it) {
  const att = it.att
  if (it.genre === 'prepare') return { icone: '⚠️', texte: `Prépare ${att.nom}`, danger: true, sous: 'Frappe très fort au prochain tour' }
  const cible = it.cible ? unite(b, it.cible) : null
  let degats = null
  if (att.puissance) {
    const vises = cible ? [cible] : (att.cible === 'ennemis' ? vivants(b, 'h') : [])
    const vals = vises.map((c) => calculerDegats(u, c, att, { hasard: false }).valeur)
    if (vals.length) {
      const moy = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
      degats = { min: Math.round(moy * 0.9), max: Math.round(moy * 1.1) }
    }
  }
  const effets = (att.effets || []).map((e) => {
    if (e.kind === 'etourdi') return `étourdit ${Math.round(e.chance * 100)} %`
    if (e.kind === 'brulure') return `brûle ${Math.round(e.chance * 100)} %`
    if (e.kind === 'buff') return `${{ def: 'défense', atq: 'attaque', mag: 'magie', vit: 'vitesse' }[e.stat]} +${Math.round((e.mult - 1) * 100)} %`
    if (e.kind === 'soin') return 'se soigne'
    return null
  }).filter(Boolean)
  let qui
  if (att.cible === 'soi') qui = 'lui-même'
  else if (att.cible === 'ennemis') qui = 'toute l\'équipe'
  else qui = cible?.nom || '?'
  const icone = it.genre === 'frappe' ? '💥' : !att.puissance ? (att.cible === 'soi' ? '✨' : '🌀') : att.cible === 'ennemis' ? '🌊' : '⚔️'
  return {
    icone,
    texte: `${att.nom} → ${qui}`,
    sous: [degats ? `${degats.min}–${degats.max} dégâts${att.cible === 'ennemis' ? ' chacun' : ''}` : null, ...effets].filter(Boolean).join(' · '),
    danger: it.genre === 'frappe',
    type: att.type,
    cible: it.cible,
  }
}

// Intentions encore à venir, pour l'affichage et l'IA
export const intentionsActives = (u) => (u.intentions || []).filter((x) => !x.faite && !x.annulee)

// Mécaniques des champions qui se déclenchent à mi-vie, tout de suite
function seuilsBoss(b, u) {
  const m = MONSTRES[u.monstre]
  if (m.script === 'bulle' && !b.flags.equipage && u.pv < u.max.pv * 0.5) {
    b.flags.equipage = true
    const uid = 'm' + b.compteurInvoc++
    const renfort = uniteMonstre('crabouille', Math.max(1, u.niveau - 2), uid)
    b.units.push(renfort)
    planifierUnite(b, renfort)
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
  return []
}

// ── Phase des héros ─────────────────────────────────────────

export function actionPossible(b, u, action) {
  if (action.kind !== 'capacite') return true
  const comp = capacite(u, action.id)
  return !!comp && u.pm >= (comp.cout || 0) && recharge(u, action.id) === 0
}

export function agir(b, uid, action) {
  const u = unite(b, uid)
  if (!u || u.camp !== 'h' || u.ko || b.fini || b.phase !== 'joueur' || b.aAgi.includes(uid)) return []
  const ev = []
  const koAvant = vivants(b, 'm').length
  let offensive = false
  if (action.kind === 'capacite') {
    const comp = capacite(u, action.id)
    if (!comp || !actionPossible(b, u, action)) return []
    u.pm -= comp.cout || 0
    if (comp.recharge) u.recharges[comp.id] = comp.recharge
    ev.push(...utiliser(b, u, comp, action.cible))
    offensive = !!comp.puissance
    // Sceptre de l'Écho : la première capacité offensive résonne une fois
    if (offensive && comp.id !== 'base' && u.pouvoirs.includes('echo') && !b.flags.echo && !verifierFin(b)) {
      b.flags.echo = true
      ev.push({ t: 'texte', texte: 'Écho ! Le sort résonne une seconde fois.', pouvoir: true })
      ev.push(...utiliser(b, u, comp, action.cible))
    }
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
  const acheves = koAvant - vivants(b, 'm').length
  // Arc du Chasseur : Pia rejoue quand elle achève un ennemi (une fois par tour)
  const rejoue = offensive && acheves > 0 && u.pouvoirs.includes('chasseur') && b.flags.chasseur !== b.tour && !verifierFin(b)
  if (rejoue) {
    b.flags.chasseur = b.tour
    ev.push({ t: 'texte', texte: `${u.nom} enchaîne et rejoue !`, pouvoir: true })
  } else b.aAgi.push(uid)
  verifierFin(b)
  majIntentions(b)
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

function executer(b, u, it) {
  u.actions += 1
  if (it.genre === 'prepare') {
    u.chargePrete = true
    return [
      { t: 'action', source: u.uid, nom: `Prépare ${it.att.nom}…`, type: it.att.type },
      { t: 'statut', cible: u.uid, texte: `${u.nom} rassemble ses forces. Gare au prochain tour !`, charge: true },
    ]
  }
  return utiliser(b, u, it.att, it.cible)
}

// Joue toute la phase des monstres puis prépare le tour suivant
export function phaseMonstres(b) {
  if (b.fini) return []
  b.phase = 'monstres'
  majIntentions(b)
  const ev = []
  for (const u of vivants(b, 'm')) ev.push(...brulure(b, u))
  if (verifierFin(b)) return ev
  const ordre = vivants(b, 'm').sort((x, y) => y.stats.vit * multBuff(y, 'vit') - x.stats.vit * multBuff(x, 'vit'))
  // Les champions agissent une seconde fois en fin de phase
  const file = [...ordre.map((u) => [u.uid, 0]), ...ordre.filter((u) => u.boss).map((u) => [u.uid, 1])]
  for (const [uid, k] of file) {
    const u = unite(b, uid)
    if (!u || u.ko) continue
    if (u.etourdi) {
      u.etourdi = false
      for (const it of intentionsActives(u)) {
        it.annulee = true
        if (it.genre === 'frappe') u.chargePrete = false
      }
      ev.push({ t: 'statut', cible: u.uid, texte: `${u.nom} est étourdi et ne bouge pas !` })
      continue
    }
    const it = u.intentions[k]
    if (!it || it.faite || it.annulee) continue
    it.faite = true
    if (it.cible && unite(b, it.cible)?.ko) majIntentions(b)
    ev.push(...executer(b, u, it))
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
    for (const k of Object.keys(u.recharges)) if (u.recharges[k] > 0) u.recharges[k] -= 1
    ev.push(...brulure(b, u))
  }
  for (const u of vivants(b, 'h')) {
    if (u.etourdi) {
      u.etourdi = false
      b.aAgi.push(u.uid)
      ev.push({ t: 'statut', cible: u.uid, texte: `${u.nom} est étourdi et passe ce tour.` })
    }
  }
  if (!verifierFin(b)) planifier(b)
  return ev
}

// Résumé à rendre au jeu une fois le combat fini
export function bilanCombat(b) {
  return {
    issue: b.fini,
    tours: b.tour,
    heros: b.units.filter((u) => u.camp === 'h').map((u) => ({ classe: u.classe, pv: u.pv, pm: u.pm, ko: u.ko })),
    vaincus: b.units.filter((u) => u.camp === 'm' && u.ko).map((u) => ({ id: u.monstre, niveau: u.niveau, elite: u.elite })),
    sac: b.sac,
  }
}
