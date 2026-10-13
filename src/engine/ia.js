// IA des héros : sert au combat automatique et aux simulations d'équilibrage.
import { vivants, herosDisponibles, agir, phaseMonstres, capacite, estimer, unite } from './battle.js'

// Choisit l'action d'un héros précis
export function choisirAction(b, uid) {
  const u = unite(b, uid)
  const ennemis = vivants(b, 'm')
  const allies = b.units.filter((x) => x.camp === 'h')
  const ko = allies.find((x) => x.ko)
  if (ko && b.sac.plume > 0) return { kind: 'objet', id: 'plume', cible: ko.uid }
  const blesse = allies.filter((x) => !x.ko).sort((a, c) => a.pv / a.max.pv - c.pv / c.max.pv)[0]
  const ratio = blesse.pv / blesse.max.pv
  if (u.capacites.includes('soin') && ratio < 0.45 && u.pm >= 4) return { kind: 'capacite', id: 'soin', cible: blesse.uid }
  if (ratio < 0.3) {
    for (const id of ['superpotion', 'potion']) if (b.sac[id] > 0) return { kind: 'objet', id, cible: blesse.uid }
  }
  // Meilleure attaque : celle qui fait le plus de dégâts estimés
  let meilleur = null
  for (const id of ['base', ...u.capacites]) {
    const c = capacite(u, id)
    if (!c || !c.puissance || (c.cout || 0) > u.pm) continue
    const cibles = c.cible === 'ennemis' ? ennemis : ennemis
    let score = 0
    let cible = null
    if (c.cible === 'ennemis') {
      for (const e of cibles) score += Math.min(e.pv, estimer(b, uid, c, e.uid).min)
    } else {
      for (const e of cibles) {
        const est = estimer(b, uid, c, e.uid)
        // Achever une cible vaut un bonus
        const s = Math.min(e.pv, est.min) + (est.ko ? 15 : 0)
        if (s > score) { score = s; cible = e.uid }
      }
    }
    score -= (c.cout || 0) * 1.5
    if (!meilleur || score > meilleur.score) meilleur = { kind: 'capacite', id, cible: cible || ennemis[0]?.uid, score }
  }
  return meilleur
}

// Fait agir tous les héros disponibles (combat automatique)
export function jouerPhaseHeros(b) {
  const ev = []
  // La mage passe en premier pour soigner si besoin
  const ordre = herosDisponibles(b).sort((a, c) => (a.classe === 'mage' ? -1 : c.classe === 'mage' ? 1 : 0))
  for (const u of ordre) {
    if (b.fini) break
    if (u.ko || b.aAgi.includes(u.uid)) continue
    ev.push({ uid: u.uid, evenements: agir(b, u.uid, choisirAction(b, u.uid)) })
  }
  return ev
}

export function jouerCombat(b, maxTours = 120) {
  for (let i = 0; i < maxTours && !b.fini; i++) {
    jouerPhaseHeros(b)
    if (!b.fini) phaseMonstres(b)
  }
  if (!b.fini) b.fini = 'defaite'
  return b.fini
}
