// IA des héros : sert au combat automatique et aux simulations d'équilibrage.
// Elle lit les intentions des monstres comme le ferait un joueur attentif.
import { vivants, herosDisponibles, agir, phaseMonstres, capacite, estimer, unite, recharge, intentionsActives } from './battle.js'

const prete = (u, id) => u.capacites.includes(id) && recharge(u, id) === 0 && u.pm >= (capacite(u, id)?.cout || 0)

// Monstre qui va porter (ou préparer) une grosse attaque ce tour
function menace(b) {
  let pire = null
  for (const m of vivants(b, 'm')) {
    for (const it of intentionsActives(m)) {
      const poids = it.genre === 'frappe' ? 3 : it.genre === 'prepare' ? 2 : 0
      if (poids && (!pire || poids > pire.poids)) pire = { m, it, poids }
    }
  }
  return pire
}

// Choisit l'action d'un héros précis
export function choisirAction(b, uid) {
  const u = unite(b, uid)
  const ennemis = vivants(b, 'm')
  const allies = b.units.filter((x) => x.camp === 'h')
  const ko = allies.find((x) => x.ko)
  if (ko && b.sac.plume > 0) return { kind: 'objet', id: 'plume', cible: ko.uid }
  const blesse = allies.filter((x) => !x.ko).sort((a, c) => a.pv / a.max.pv - c.pv / c.max.pv)[0]
  const ratio = blesse.pv / blesse.max.pv

  // Bastien : interrompre la grosse attaque, sinon la détourner sur lui
  if (u.classe === 'guerrier') {
    const danger = menace(b)
    if (danger && prete(u, 'interruption')) return { kind: 'capacite', id: 'interruption', cible: danger.m.uid }
    if (danger?.it.genre === 'frappe' && danger.it.cible !== u.uid && u.pv / u.max.pv > 0.5 && prete(u, 'provoc')) return { kind: 'capacite', id: 'provoc' }
  }
  if (u.capacites.includes('grandsoin') && allies.filter((x) => !x.ko && x.pv / x.max.pv < 0.5).length >= 2 && prete(u, 'grandsoin')) return { kind: 'capacite', id: 'grandsoin' }
  if (u.capacites.includes('soin') && ratio < 0.45 && prete(u, 'soin')) return { kind: 'capacite', id: 'soin', cible: blesse.uid }
  if (ratio < 0.3) {
    for (const id of ['superpotion', 'potion']) if (b.sac[id] > 0) return { kind: 'objet', id, cible: blesse.uid }
  }
  // Ouvrir la garde de la plus grosse cible si des alliés peuvent encore frapper
  const restants = herosDisponibles(b).filter((x) => x.uid !== uid).length
  for (const id of ['brisegarde', 'marque']) {
    if (restants && prete(u, id)) {
      const cible = ennemis.filter((e) => !e.expose).sort((a, c) => c.pv - a.pv)[0]
      if (cible && cible.pv > cible.max.pv * 0.4) return { kind: 'capacite', id, cible: cible.uid }
    }
  }
  // Meilleure attaque : celle qui fait le plus de dégâts estimés
  let meilleur = null
  for (const id of ['base', ...u.capacites]) {
    const c = capacite(u, id)
    if (!c || !c.puissance || !prete(u, id) && id !== 'base') continue
    let score = 0
    let cible = null
    if (c.cible === 'ennemis') {
      for (const e of ennemis) score += Math.min(e.pv, estimer(b, uid, c, e.uid).min)
    } else {
      for (const e of ennemis) {
        const est = estimer(b, uid, c, e.uid)
        // Achever une cible vaut un bonus
        const s = Math.min(e.pv, est.min) + (est.ko ? 15 : 0)
        if (s > score) { score = s; cible = e.uid }
      }
    }
    score -= (c.cout || 0) * 1.5
    if (!meilleur || score > meilleur.score) meilleur = { kind: 'capacite', id, cible: cible || ennemis[0]?.uid, score }
  }
  if (u.capacites.includes('meditation') && u.pm < 6 && prete(u, 'meditation')) return { kind: 'capacite', id: 'meditation' }
  return meilleur
}

// Fait agir tous les héros disponibles (combat automatique)
export function jouerPhaseHeros(b) {
  const ev = []
  const rang = { guerrier: 0, mage: 1, rodeur: 2 }
  for (let garde = 0; garde < 8 && !b.fini; garde++) {
    const u = herosDisponibles(b).sort((a, c) => rang[a.classe] - rang[c.classe])[0]
    if (!u) break
    const action = choisirAction(b, u.uid) || { kind: 'defendre' }
    let r = agir(b, u.uid, action)
    if (!r.length) r = agir(b, u.uid, { kind: 'defendre' })
    ev.push({ uid: u.uid, evenements: r })
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
