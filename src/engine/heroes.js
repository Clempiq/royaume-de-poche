import { CLASSES, NIVEAU_MAX, xpPourNiveau } from '../data/heroes.js'
import { statsObjet } from './loot.js'

export function nouveauHeros(classe) {
  const h = { classe, niveau: 1, xp: 0, equip: { arme: null, armure: null, accessoire: null } }
  const s = statsBrutes(h)
  h.pv = s.pv
  h.pm = s.pm
  return h
}

function statsBrutes(h) {
  const c = CLASSES[h.classe]
  const s = {}
  for (const k of Object.keys(c.base)) {
    s[k] = Math.round(c.base[k] + (c.croissance[k] || 0) * (h.niveau - 1))
  }
  return s
}

// Statistiques complètes : niveau + équipement porté
export function statsHeros(h, inventaire) {
  const s = statsBrutes(h)
  s.elem = {}
  for (const id of Object.values(h.equip)) {
    if (!id) continue
    const o = inventaire.find((x) => x.id === id)
    if (!o) continue
    for (const [k, v] of Object.entries(statsObjet(o))) s[k] = (s[k] || 0) + v
    for (const [k, v] of Object.entries(o.elem || {})) s.elem[k] = (s.elem[k] || 0) + v
  }
  return s
}

export function competencesConnues(h) {
  return CLASSES[h.classe].competences.filter((c) => c.niveau <= h.niveau)
}

// Ajoute de l'XP ; renvoie la liste des niveaux gagnés et des compétences apprises
export function gagnerXp(h, xp, inventaire) {
  const gains = []
  if (h.niveau >= NIVEAU_MAX) return gains
  const avant = statsHeros(h, inventaire)
  h.xp += Math.round(xp)
  while (h.niveau < NIVEAU_MAX && h.xp >= xpPourNiveau(h.niveau)) {
    h.xp -= xpPourNiveau(h.niveau)
    h.niveau += 1
    const nouvelles = CLASSES[h.classe].competences.filter((c) => c.niveau === h.niveau)
    gains.push({ niveau: h.niveau, competences: nouvelles.map((c) => c.nom) })
  }
  if (h.niveau >= NIVEAU_MAX) h.xp = 0
  if (gains.length) {
    // Les PV et PM gagnés à la montée de niveau sont ajoutés tout de suite
    const apres = statsHeros(h, inventaire)
    if (h.pv > 0) h.pv = Math.min(apres.pv, h.pv + (apres.pv - avant.pv))
    h.pm = Math.min(apres.pm, h.pm + (apres.pm - avant.pm))
  }
  return gains
}

// Après un changement d'équipement, on garde les PV/PM dans les limites
export function bornerHeros(h, inventaire) {
  const s = statsHeros(h, inventaire)
  h.pv = Math.min(h.pv, s.pv)
  h.pm = Math.min(h.pm, s.pm)
}

export function soignerHeros(h, inventaire) {
  const s = statsHeros(h, inventaire)
  h.pv = s.pv
  h.pm = s.pm
}
