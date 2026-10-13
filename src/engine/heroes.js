import { CLASSES, NIVEAU_MAX, MAX_CAPACITES, xpPourNiveau, capaciteParId } from '../data/heroes.js'
import { statsObjet, elemObjet } from './loot.js'
import { BATIMENTS, NIVEAU_BIBLIOTHEQUE_5E_CAPACITE } from '../data/camp.js'

// Bonus permanents donnés par les bâtiments du village
export function bonusVillage(camp) {
  const b = { atq: 1, mag: 1, pv: 1, def: 1, pm: 0 }
  if (!camp) return b
  for (const [k, def] of Object.entries(BATIMENTS)) {
    const n = camp[k]?.niveau || 0
    if (!def.bonus || !n) continue
    for (const [stat, v] of Object.entries(def.bonus)) {
      if (stat === 'pm') b.pm += v * n
      else b[stat] += v * n
    }
  }
  return b
}

export const maxCapacites = (camp) => MAX_CAPACITES + ((camp?.bibliotheque?.niveau || 0) >= NIVEAU_BIBLIOTHEQUE_5E_CAPACITE ? 1 : 0)

export function nouveauHeros(classe) {
  const h = { classe, niveau: 1, xp: 0, equip: { arme: null, armure: null, accessoire: null }, connues: [], capacites: [] }
  apprendreParNiveau(h)
  const s = statsBrutes(h)
  h.pv = s.pv
  h.pm = s.pm
  return h
}

// Met à jour une ancienne sauvegarde (avant les capacités à choisir)
export function migrerHeros(h) {
  if (!h.connues) {
    h.connues = []
    h.capacites = []
    // Les 4 premières capacités sont équipées, les autres attendent dans Équipe
    apprendreParNiveau(h)
  }
  return h
}

// Version 3 : les héros se spécialisent, certaines capacités disparaissent.
// Renvoie les identifiants retirés (pour rembourser leur prix).
export function migrerCapacites(h) {
  const ids = new Set(CLASSES[h.classe].competences.map((c) => c.id))
  const retirees = h.connues.filter((id) => !ids.has(id))
  h.connues = h.connues.filter((id) => ids.has(id))
  h.capacites = h.capacites.filter((id) => ids.has(id))
  apprendreParNiveau(h)
  for (const id of h.connues) if (h.capacites.length < MAX_CAPACITES && !h.capacites.includes(id)) h.capacites.push(id)
  return retirees
}

function apprendreParNiveau(h) {
  const nouvelles = []
  for (const c of CLASSES[h.classe].competences) {
    if (c.niveau && c.niveau <= h.niveau && !h.connues.includes(c.id)) {
      h.connues.push(c.id)
      nouvelles.push(c)
      if (h.capacites.length < MAX_CAPACITES) h.capacites.push(c.id)
    }
  }
  return nouvelles
}

export function apprendre(h, id) {
  if (h.connues.includes(id)) return false
  h.connues.push(id)
  if (h.capacites.length < MAX_CAPACITES) h.capacites.push(id)
  return true
}

function statsBrutes(h) {
  const c = CLASSES[h.classe]
  const s = {}
  for (const k of Object.keys(c.base)) {
    s[k] = Math.round(c.base[k] + (c.croissance[k] || 0) * (h.niveau - 1))
  }
  return s
}

// Statistiques complètes : niveau + équipement porté + village
export function statsHeros(h, inventaire, camp) {
  const s = statsBrutes(h)
  const v = bonusVillage(camp)
  for (const k of ['atq', 'mag', 'pv', 'def']) s[k] = Math.round(s[k] * v[k])
  s.pm += v.pm
  s.puiss = 0
  s.elem = {}
  s.typeArme = 'neutre'
  s.pouvoirs = []
  for (const [slot, id] of Object.entries(h.equip)) {
    if (!id) continue
    const o = inventaire.find((x) => x.id === id)
    if (!o) continue
    for (const [k, v] of Object.entries(statsObjet(o))) s[k] = (s[k] || 0) + v
    if (o.pouvoir) s.pouvoirs.push(o.pouvoir)
    const el = elemObjet(o)
    for (const [k, v] of Object.entries(el)) s.elem[k] = (s.elem[k] || 0) + v
    // Une arme élémentaire donne son type à l'attaque de base
    if (slot === 'arme') {
      const dominant = Object.entries(el).sort((a, b) => b[1] - a[1])[0]
      if (dominant) s.typeArme = dominant[0]
    }
  }
  return s
}

export function capacitesEquipees(h) {
  return h.capacites.map((id) => capaciteParId(h.classe, id)).filter(Boolean)
}

// Ajoute de l'XP ; renvoie la liste des niveaux gagnés et des capacités apprises
export function gagnerXp(h, xp, inventaire, camp) {
  const gains = []
  if (h.niveau >= NIVEAU_MAX) return gains
  const avant = statsHeros(h, inventaire, camp)
  h.xp += Math.round(xp)
  while (h.niveau < NIVEAU_MAX && h.xp >= xpPourNiveau(h.niveau)) {
    h.xp -= xpPourNiveau(h.niveau)
    h.niveau += 1
    const nouvelles = apprendreParNiveau(h)
    gains.push({ niveau: h.niveau, competences: nouvelles.map((c) => c.nom), aEquiper: nouvelles.some((c) => !h.capacites.includes(c.id)) })
  }
  if (h.niveau >= NIVEAU_MAX) h.xp = 0
  if (gains.length) {
    const apres = statsHeros(h, inventaire, camp)
    if (h.pv > 0) h.pv = Math.min(apres.pv, h.pv + (apres.pv - avant.pv))
    h.pm = Math.min(apres.pm, h.pm + (apres.pm - avant.pm))
  }
  return gains
}

export function bornerHeros(h, inventaire, camp) {
  const s = statsHeros(h, inventaire, camp)
  h.pv = Math.min(h.pv, s.pv)
  h.pm = Math.min(h.pm, s.pm)
}

export function soignerHeros(h, inventaire, camp) {
  const s = statsHeros(h, inventaire, camp)
  h.pv = s.pv
  h.pm = s.pm
}
