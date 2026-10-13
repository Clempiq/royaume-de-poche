// Règles du jeu hors combat : progression, récompenses, boutique,
// voyages, campement. Les fonctions modifient l'état reçu (un brouillon)
// et renvoient éventuellement un rapport à afficher.

import { CLASSES, ORDRE_EQUIPE, MAX_CAPACITES, capaciteParId } from '../data/heroes.js'
import { MONSTRES } from '../data/monsters.js'
import { VILLES, ORDRE_VILLES, VOYAGES, EVENEMENTS_VOYAGE, REPAS, DUREE_REPAS, EXPEDITIONS } from '../data/world.js'
import { CONSOMMABLES } from '../data/items.js'
import { BATIMENTS, NIVEAU_MAX_BATIMENT } from '../data/camp.js'
import { nouveauHeros, gagnerXp, soignerHeros, statsHeros, bornerHeros, migrerHeros, apprendre } from './heroes.js'
import { genererObjet, tirerRarete, prixVente, coutForge, peutForger, reenchanter, coutEnchantement } from './loot.js'
import { entre, tiragePondere, maintenant, minutesEnMs, heuresJeu, graine, hacher, vitesse } from './util.js'

export const CLE_SAUVEGARDE = 'royaume-de-poche-v1'
export const TAILLE_SAC = 40
const MULT_XP = 1.6

export function nouvellePartie() {
  const t = maintenant()
  const s = {
    version: 2,
    cree: t,
    introVue: false,
    ville: 'brioche',
    villesVisitees: ['brioche'],
    eclats: [],
    voyage: null,
    or: 60,
    heros: Object.fromEntries(ORDRE_EQUIPE.map((c) => [c, nouveauHeros(c)])),
    inventaire: [],
    sac: { potion: 3, ether: 1 },
    camp: {
      mine: { niveau: 1, collecte: t },
      entrainement: { niveau: 1, collecte: t },
      herboristerie: { niveau: 1, collecte: t },
      forge: { niveau: 1 },
      chantier: null,
    },
    repas: null,
    expedition: null,
    aides: {},
    bestiaire: {},
    boutique: {},
    stats: { combats: 0, victoires: 0, defaites: 0 },
    finVue: false,
  }
  // Équipement de départ : une arme commune par héros
  for (const c of ORDRE_EQUIPE) {
    const o = genererObjet({ niveau: 1, rarete: 'commun', base: CLASSES[c].arme })
    s.inventaire.push(o)
    s.heros[c].equip.arme = o.id
    soignerHeros(s.heros[c], s.inventaire)
  }
  return s
}

export function charger() {
  try {
    const brut = localStorage.getItem(CLE_SAUVEGARDE)
    if (!brut) return null
    const s = JSON.parse(brut)
    if (!s || !s.version) return null
    return migrer(s)
  } catch {
    return null
  }
}

// Met à niveau une sauvegarde d'une version précédente
export function migrer(s) {
  if (s.version < 2) {
    for (const c of ORDRE_EQUIPE) migrerHeros(s.heros[c])
    s.camp.herboristerie = s.camp.herboristerie || { niveau: 1, collecte: maintenant() }
    s.repas = null
    s.expedition = null
    s.aides = {}
    s.version = 2
  }
  return s
}

export function sauvegarder(s) {
  try {
    localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(s))
  } catch {
    /* stockage indisponible : la partie continue sans sauvegarde */
  }
}

export const villeCourante = (s) => VILLES[s.ville]
export const areneBattue = (s, ville = s.ville) => s.eclats.includes(VILLES[ville].arene.boss)

// ── Tic : ce qui avance avec le temps ───────────────────────
export function tic(s) {
  const notes = []
  const ch = s.camp.chantier
  if (ch && maintenant() >= ch.fin) {
    s.camp[ch.batiment].niveau += 1
    s.camp.chantier = null
    notes.push(`${BATIMENTS[ch.batiment].nom} passe au niveau ${s.camp[ch.batiment].niveau} !`)
  }
  return notes
}

// ── Rencontres ──────────────────────────────────────────────
export function rencontreSauvage(s) {
  let zone
  let niveaux
  if (s.voyage) {
    zone = VILLES[s.voyage.vers].zone
    niveaux = [Math.max(1, zone.niveaux[0] - 1), zone.niveaux[0]]
  } else {
    zone = villeCourante(s).zone
    niveaux = zone.niveaux
  }
  const n = tiragePondere(zone.groupe)
  // Le niveau des monstres suit celui de l'équipe, dans les limites de la zone
  const moy = Math.round(ORDRE_EQUIPE.reduce((t, c) => t + s.heros[c].niveau, 0) / ORDRE_EQUIPE.length)
  const centre = Math.max(niveaux[0], Math.min(niveaux[1], moy))
  return Array.from({ length: n }, () => ({
    id: tiragePondere(zone.monstres),
    niveau: Math.max(niveaux[0], Math.min(niveaux[1], centre + entre(-1, 1) - (n > 1 ? 1 : 0))),
  }))
}

export function rencontreArene(s) {
  const a = villeCourante(s).arene
  return [{ id: a.boss, niveau: a.niveau }]
}

export function herosPourCombat(s) {
  const r = s.repas ? REPAS[s.repas.id].effet : {}
  return ORDRE_EQUIPE.map((c) => {
    const h = s.heros[c]
    const st = statsHeros(h, s.inventaire)
    for (const k of ['pv', 'atq', 'mag', 'vit']) if (r[k]) st[k] = Math.round(st[k] * r[k])
    if (r.crit) st.crit += r.crit
    const pv = r.pv && h.pv >= statsHeros(h, s.inventaire).pv ? st.pv : h.pv
    return { classe: c, niveau: h.niveau, pv, pm: h.pm, stats: st, capacites: h.capacites }
  })
}

// ── Fin de combat ───────────────────────────────────────────
export function finCombat(s, bilan, contexte) {
  s.sac = { ...bilan.sac }
  for (const k of Object.keys(s.sac)) if (s.sac[k] <= 0) delete s.sac[k]
  for (const h of bilan.heros) {
    s.heros[h.classe].pv = h.pv
    s.heros[h.classe].pm = h.pm
    bornerHeros(s.heros[h.classe], s.inventaire)
  }
  if (s.repas && bilan.issue !== 'fuite') {
    s.repas.combats -= 1
    if (s.repas.combats <= 0) s.repas = null
  }
  s.stats.combats += 1
  const rapport = { issue: bilan.issue, xp: 0, or: 0, objets: [], consommables: {}, niveaux: [], eclat: null }

  if (bilan.issue === 'defaite') {
    s.stats.defaites += 1
    const perte = Math.floor(s.or * 0.1)
    s.or -= perte
    rapport.or = -perte
    for (const c of ORDRE_EQUIPE) soignerHeros(s.heros[c], s.inventaire)
    return rapport
  }
  if (bilan.issue !== 'victoire') return rapport
  s.stats.victoires += 1

  let xp = 0
  let or = 0
  let nivMax = 1
  for (const v of bilan.vaincus) {
    const m = MONSTRES[v.id]
    xp += m.xp * (1 + 0.3 * (v.niveau - 1)) * MULT_XP
    or += m.or * (1 + 0.2 * (v.niveau - 1)) * (0.8 + Math.random() * 0.4)
    nivMax = Math.max(nivMax, v.niveau)
    s.bestiaire[v.id] = (s.bestiaire[v.id] || 0) + 1
  }
  rapport.xp = Math.round(xp)
  rapport.or = Math.round(or)
  s.or += rapport.or

  for (const h of bilan.heros) {
    const heros = s.heros[h.classe]
    const gains = gagnerXp(heros, h.ko ? xp / 2 : xp, s.inventaire)
    for (const g of gains) rapport.niveaux.push({ classe: h.classe, ...g })
  }

  if (contexte === 'arene') {
    const boss = bilan.vaincus.find((v) => MONSTRES[v.id].boss)
    if (boss && !s.eclats.includes(boss.id)) {
      s.eclats.push(boss.id)
      rapport.eclat = boss.id
    }
    const rar = Math.random() < 0.2 ? 'legendaire' : 'epique'
    rapport.objets.push(genererObjet({ niveau: nivMax, rarete: rar }))
    rapport.objets.push(genererObjet({ niveau: nivMax, rarete: tirerRarete(25) }))
    rapport.consommables.plume = 1
  } else {
    const chance = 0.28 + 0.07 * bilan.vaincus.length
    if (Math.random() < chance) rapport.objets.push(genererObjet({ niveau: nivMax }))
    if (Math.random() < 0.18) rapport.consommables[nivMax >= 8 ? 'superpotion' : 'potion'] = 1
    if (Math.random() < 0.06) rapport.consommables.ether = 1
  }
  for (const o of rapport.objets) ajouterObjet(s, o)
  for (const [k, n] of Object.entries(rapport.consommables)) s.sac[k] = (s.sac[k] || 0) + n
  return rapport
}

export function ajouterObjet(s, o) {
  if (s.inventaire.filter((x) => !estEquipe(s, x.id)).length >= TAILLE_SAC) {
    // Sac plein : l'objet est vendu automatiquement
    s.or += prixVente(o)
    o.vendu = true
    return false
  }
  s.inventaire.push(o)
  return true
}

export function estEquipe(s, id) {
  return ORDRE_EQUIPE.some((c) => Object.values(s.heros[c].equip).includes(id))
}

export function porteur(s, id) {
  return ORDRE_EQUIPE.find((c) => Object.values(s.heros[c].equip).includes(id)) || null
}

// ── Soins ───────────────────────────────────────────────────
export function seReposer(s) {
  for (const c of ORDRE_EQUIPE) soignerHeros(s.heros[c], s.inventaire)
}

export function equipeEnForme(s) {
  return ORDRE_EQUIPE.every((c) => {
    const h = s.heros[c]
    const st = statsHeros(h, s.inventaire)
    return h.pv >= st.pv && h.pm >= st.pm
  })
}

export function utiliserConsommable(s, id, classe) {
  const o = CONSOMMABLES[id]
  const h = s.heros[classe]
  if (!o || !(s.sac[id] > 0)) return false
  const st = statsHeros(h, s.inventaire)
  if (o.effet.reanime) {
    if (h.pv > 0) return false
    h.pv = Math.round(st.pv * o.effet.reanime)
  } else {
    if (h.pv <= 0) return false
    if (o.effet.pv) h.pv = Math.min(st.pv, h.pv + o.effet.pv)
    if (o.effet.pm) h.pm = Math.min(st.pm, h.pm + o.effet.pm)
  }
  s.sac[id] -= 1
  if (s.sac[id] <= 0) delete s.sac[id]
  return true
}

// ── Équipement ──────────────────────────────────────────────
export function equiper(s, classe, id) {
  const o = s.inventaire.find((x) => x.id === id)
  if (!o) return false
  if (o.classe && o.classe !== classe) return false
  const ancien = porteur(s, id)
  if (ancien) s.heros[ancien].equip[o.slot] = null
  s.heros[classe].equip[o.slot] = id
  for (const c of ORDRE_EQUIPE) bornerHeros(s.heros[c], s.inventaire)
  return true
}

export function desequiper(s, classe, slot) {
  s.heros[classe].equip[slot] = null
  bornerHeros(s.heros[classe], s.inventaire)
}

export function vendre(s, id) {
  if (estEquipe(s, id)) return false
  const i = s.inventaire.findIndex((x) => x.id === id)
  if (i < 0) return false
  s.or += prixVente(s.inventaire[i])
  s.inventaire.splice(i, 1)
  return true
}

export function forger(s, id) {
  const o = s.inventaire.find((x) => x.id === id)
  if (!o || !peutForger(o, s.camp.forge.niveau)) return false
  const c = coutForge(o)
  if (s.or < c) return false
  s.or -= c
  o.forge = (o.forge || 0) + 1
  return true
}

// ── Boutique ────────────────────────────────────────────────
const RENOUVELLEMENT_H = 4

export function fenetreBoutique() {
  return Math.floor(heuresJeu(0) / RENOUVELLEMENT_H)
}

export function finFenetreBoutique() {
  const f = fenetreBoutique() + 1
  return (f * RENOUVELLEMENT_H * 3600000) / vitesse()
}

export function articlesBoutique(s, ville = s.ville) {
  const f = fenetreBoutique()
  const b = s.boutique[ville]
  if (b && b.fenetre === f) return b
  const rng = graine(hacher(ville + ':' + f + ':' + s.cree))
  const niv = VILLES[ville].zone.niveaux[1]
  const bases = ['epee', 'sceptre', 'arc', 'armure', 'anneau', 'amulette']
  const articles = []
  for (let i = 0; i < 3; i++) {
    const base = bases.splice(Math.floor(rng() * bases.length), 1)[0]
    const rarete = rng() < 0.3 ? 'epique' : 'rare'
    const o = genererObjet({ niveau: niv, rarete, base, rng })
    o.id = `b-${ville}-${f}-${i}`
    o.prixAchat = Math.round(o.prix * 1.6)
    articles.push(o)
  }
  s.boutique[ville] = { fenetre: f, articles, achetes: [] }
  return s.boutique[ville]
}

export function acheterConsommable(s, id, n = 1) {
  const o = CONSOMMABLES[id]
  if (!o || s.or < o.prix * n) return false
  s.or -= o.prix * n
  s.sac[id] = (s.sac[id] || 0) + n
  return true
}

export function acheterEquipement(s, id) {
  const b = articlesBoutique(s)
  const o = b.articles.find((x) => x.id === id)
  if (!o || b.achetes.includes(id) || s.or < o.prixAchat) return false
  if (s.inventaire.filter((x) => !estEquipe(s, x.id)).length >= TAILLE_SAC) return false
  s.or -= o.prixAchat
  b.achetes.push(id)
  const copie = { ...o, stats: { ...o.stats }, elem: { ...o.elem } }
  delete copie.prixAchat
  s.inventaire.push(copie)
  return true
}

// ── Voyages ─────────────────────────────────────────────────
export function infoVoyage(s) {
  const suiv = villeCourante(s).suivante
  if (!suiv) return null
  return { vers: suiv, ...VOYAGES[`${s.ville}>${suiv}`] }
}

export function partirEnVoyage(s) {
  const v = infoVoyage(s)
  if (!v || !areneBattue(s) || s.voyage) return false
  const debut = maintenant()
  const evenements = Array.from({ length: v.evenements }, () => tiragePondere(EVENEMENTS_VOYAGE.map((e) => [e.id, e.poids])))
  s.voyage = { de: s.ville, vers: v.vers, debut, fin: debut + minutesEnMs(v.minutes), evenements }
  return true
}

export function voyageTermine(s) {
  return s.voyage && maintenant() >= s.voyage.fin
}

export function arriver(s) {
  if (!voyageTermine(s)) return null
  const v = s.voyage
  const niv = VILLES[v.vers].zone.niveaux[0]
  const recits = []
  for (const id of v.evenements) {
    const e = EVENEMENTS_VOYAGE.find((x) => x.id === id)
    const r = { texte: e.texte, gains: [] }
    if (id === 'or') {
      const or = entre(6, 10) * niv
      s.or += or
      r.gains.push(`+${or} or`)
    } else if (id === 'potion') {
      const k = niv >= 8 ? 'superpotion' : 'potion'
      s.sac[k] = (s.sac[k] || 0) + 2
      r.gains.push(`+2 ${CONSOMMABLES[k].nom.toLowerCase()}s`)
    } else if (id === 'objet') {
      const o = genererObjet({ niveau: niv, rarete: tirerRarete(12) })
      ajouterObjet(s, o)
      r.objet = o
    } else if (id === 'xp' || id === 'combat') {
      const xp = (id === 'xp' ? 25 : 15) * niv
      for (const c of ORDRE_EQUIPE) gagnerXp(s.heros[c], xp, s.inventaire)
      r.gains.push(`+${xp} XP pour chaque héros`)
      if (id === 'combat') {
        const or = 3 * niv
        s.or += or
        r.gains.push(`+${or} or`)
      }
    }
    recits.push(r)
  }
  s.ville = v.vers
  if (!s.villesVisitees.includes(v.vers)) s.villesVisitees.push(v.vers)
  s.voyage = null
  seReposer(s)
  return { ville: v.vers, recits }
}

// ── Campement ───────────────────────────────────────────────
export function enStock(s, bat) {
  const b = s.camp[bat]
  const def = BATIMENTS[bat]
  return Math.floor(Math.min(def.capacite[b.niveau], def.production[b.niveau] * heuresJeu(b.collecte)))
}

export function recolter(s, bat) {
  const n = enStock(s, bat)
  if (n <= 0) return 0
  if (bat === 'mine') s.or += n
  if (bat === 'entrainement') for (const c of ORDRE_EQUIPE) gagnerXp(s.heros[c], n, s.inventaire)
  if (bat === 'herboristerie') {
    const sup = s.camp.herboristerie.niveau >= 3 ? Math.floor(n / 2) : 0
    if (sup) s.sac.superpotion = (s.sac.superpotion || 0) + sup
    s.sac.potion = (s.sac.potion || 0) + (n - sup)
  }
  s.camp[bat].collecte = maintenant()
  return n
}

export function peutAmeliorer(s, bat) {
  const b = s.camp[bat]
  if (s.camp.chantier) return { ok: false, raison: 'Un chantier est déjà en cours.' }
  if (b.niveau >= NIVEAU_MAX_BATIMENT) return { ok: false, raison: 'Niveau maximum atteint.' }
  const cout = BATIMENTS[bat].cout[b.niveau + 1]
  if (s.or < cout) return { ok: false, raison: `Il faut ${cout} or.` }
  return { ok: true, cout }
}

export function ameliorer(s, bat) {
  const p = peutAmeliorer(s, bat)
  if (!p.ok) return false
  if (bat !== 'forge') recolter(s, bat)
  s.or -= p.cout
  const duree = BATIMENTS[bat].duree[s.camp[bat].niveau + 1]
  s.camp.chantier = { batiment: bat, debut: maintenant(), fin: maintenant() + minutesEnMs(duree) }
  return true
}

export function progressionAventure(s) {
  return { eclats: s.eclats.length, total: ORDRE_VILLES.length }
}

// ── Boulangerie ─────────────────────────────────────────────
export function acheterRepas(s, id) {
  const r = REPAS[id]
  if (!r || s.or < r.prix) return false
  s.or -= r.prix
  s.repas = { id, combats: DUREE_REPAS }
  return true
}

// ── Maîtres d'armes et capacités ────────────────────────────
export function capacitesEnseignees(ville) {
  const liste = []
  for (const c of ORDRE_EQUIPE) for (const k of CLASSES[c].competences) if (k.maitre === ville) liste.push({ classe: c, ...k })
  return liste
}

export function apprendreCapacite(s, classe, id) {
  const k = capaciteParId(classe, id)
  const h = s.heros[classe]
  if (!k || !k.prix || h.connues.includes(id) || s.or < k.prix) return false
  s.or -= k.prix
  return apprendre(h, id)
}

// Change les 4 capacités emportées au combat
export function basculerCapacite(s, classe, id) {
  const h = s.heros[classe]
  if (!h.connues.includes(id)) return false
  if (h.capacites.includes(id)) {
    if (h.capacites.length <= 1) return false
    h.capacites = h.capacites.filter((x) => x !== id)
  } else {
    if (h.capacites.length >= MAX_CAPACITES) return false
    h.capacites.push(id)
  }
  return true
}

// ── Expéditions en mer ──────────────────────────────────────
export function partirExpedition(s, id) {
  const e = EXPEDITIONS[id]
  if (!e || s.expedition || s.or < e.cout) return false
  s.or -= e.cout
  s.expedition = { id, debut: maintenant(), fin: maintenant() + minutesEnMs(e.minutes) }
  return true
}

export const expeditionRentree = (s) => !!s.expedition && maintenant() >= s.expedition.fin

export function recupererExpedition(s) {
  if (!expeditionRentree(s)) return null
  const e = EXPEDITIONS[s.expedition.id]
  const b = e.butin
  const niv = Math.max(...ORDRE_EQUIPE.map((c) => s.heros[c].niveau))
  const r = { nom: e.nom, or: entre(b.or[0], b.or[1]), objets: [], consommables: {} }
  s.or += r.or
  if (b.potions) r.consommables[niv >= 8 ? 'superpotion' : 'potion'] = b.potions
  if (b.plume) r.consommables.plume = b.plume
  if (b.objet) {
    const rar = b.objet === 'epique' ? (Math.random() < 0.25 ? 'legendaire' : 'epique') : tirerRarete(b.bonus || 0) === 'commun' ? 'rare' : tirerRarete(b.bonus || 0)
    const o = genererObjet({ niveau: niv, rarete: rar })
    ajouterObjet(s, o)
    r.objets.push(o)
  }
  for (const [k, n] of Object.entries(r.consommables)) s.sac[k] = (s.sac[k] || 0) + n
  s.expedition = null
  return r
}

// ── Enchantement ────────────────────────────────────────────
export function enchanter(s, id) {
  const o = s.inventaire.find((x) => x.id === id)
  if (!o || o.rarete === 'commun') return false
  const c = coutEnchantement(o)
  if (s.or < c) return false
  s.or -= c
  reenchanter(o)
  for (const k of ORDRE_EQUIPE) bornerHeros(s.heros[k], s.inventaire)
  return true
}
