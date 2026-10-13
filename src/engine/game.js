// Règles du jeu hors combat : progression, récompenses, boutique,
// voyages, village. Les fonctions modifient l'état reçu (un brouillon)
// et renvoient éventuellement un rapport à afficher.

import { CLASSES, ORDRE_EQUIPE, MAX_CAPACITES, capaciteParId } from '../data/heroes.js'
import { MONSTRES } from '../data/monsters.js'
import { VILLES, ORDRE_VILLES, VOYAGES, SOIN_FEU, REPAS, DUREE_REPAS, EXPEDITIONS, REGLES_DEFI, NIVEAU_BONUS_DEFI } from '../data/world.js'
import { CONSOMMABLES } from '../data/items.js'
import { BATIMENTS } from '../data/camp.js'
import { nouveauHeros, gagnerXp, soignerHeros, statsHeros, bornerHeros, migrerHeros, migrerCapacites, apprendre, maxCapacites } from './heroes.js'
import { genererObjet, tirerRarete, prixVente, coutForge, peutForger, reenchanter, coutEnchantement, donnerPouvoir } from './loot.js'
import { entre, tiragePondere, maintenant, minutesEnMs, heuresJeu, graine, hacher, vitesse } from './util.js'

export const CLE_SAUVEGARDE = 'royaume-de-poche-v1'
export const TAILLE_SAC = 40
// Réglages d'équilibrage (modifiables par la simulation)
export const REGLAGES = { multXp: 2.7 }
export const VERSION = 3

export function nouveauVillage(t = maintenant()) {
  return {
    chateau: { niveau: 1 },
    mine: { niveau: 1, collecte: t },
    herboristerie: { niveau: 1, collecte: t },
    forge: { niveau: 1 },
    caserne: { niveau: 0 },
    remparts: { niveau: 0 },
    bibliotheque: { niveau: 0 },
    hutte: { niveau: 0 },
    chantiers: [],
  }
}

export function nouvellePartie() {
  const t = maintenant()
  const s = {
    version: VERSION,
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
    camp: nouveauVillage(t),
    repas: null,
    expedition: null,
    parcours: { brioche: nouveauParcours() },
    defi: null,
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
    soignerHeros(s.heros[c], s.inventaire, s.camp)
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
  if (s.version < 3) migrerV3(s)
  return s
}

// Prix des anciennes capacités de maître qui ont disparu : on rembourse
const REMBOURSEMENTS = { lierre: 150, maree: 380, tonnerre: 420, ardente: 650, cage: 400, rochers: 600, harpon: 360, incendiaire: 600, percecroc: 650 }

// Version 3 : parcours, routes jouables, héros spécialisés, atelier
function migrerV3(s) {
  const notes = []
  let rembourse = 0
  for (const c of ORDRE_EQUIPE) {
    for (const id of migrerCapacites(s.heros[c])) rembourse += REMBOURSEMENTS[id] || 0
  }
  // Le terrain d'entraînement disparaît : son or est rendu
  const ent = s.camp.entrainement
  if (ent) {
    const couts = [0, 0, 110, 320, 750, 1500]
    for (let n = 2; n <= ent.niveau; n++) rembourse += couts[n]
    if (s.camp.chantier?.batiment === 'entrainement') {
      rembourse += couts[ent.niveau + 1] || 0
      s.camp.chantier = null
    }
    delete s.camp.entrainement
  }
  // Le campement devient un village : château et nouveaux bâtiments
  const village = nouveauVillage()
  for (const k of Object.keys(village)) if (k !== 'chantiers' && !s.camp[k]) s.camp[k] = village[k]
  // Le château suit le plus haut bâtiment déjà construit
  s.camp.chateau.niveau = Math.max(s.camp.chateau.niveau, ...['mine', 'herboristerie', 'forge'].map((k) => s.camp[k].niveau))
  s.camp.chantiers = s.camp.chantier ? [s.camp.chantier] : []
  delete s.camp.chantier
  if (rembourse) {
    s.or += rembourse
    notes.push(`${rembourse} or remboursés (capacités et bâtiment retirés du jeu)`)
  }
  for (const o of s.inventaire) donnerPouvoir(o)
  // Parcours : les villes dont le champion est battu sont terminées
  s.parcours = {}
  for (const v of s.villesVisitees || [s.ville]) {
    s.parcours[v] = nouveauParcours()
    if (s.eclats.includes(VILLES[v].arene.boss)) terminerParcours(s.parcours[v], VILLES[v].parcours)
  }
  // Plus de voyage chronométré : la route se joue
  if (s.voyage) s.voyage = { de: s.voyage.de, vers: s.voyage.vers, route: nouveauParcours() }
  if (s.repas && !REPAS[s.repas.id]) s.repas = null
  s.defi = null
  s.version = 3
  s.notesMigration = notes
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
  const restants = []
  for (const ch of s.camp.chantiers || []) {
    if (maintenant() >= ch.fin) {
      s.camp[ch.batiment].niveau += 1
      const n = s.camp[ch.batiment].niveau
      if (BATIMENTS[ch.batiment].production) s.camp[ch.batiment].collecte = s.camp[ch.batiment].collecte || maintenant()
      notes.push(n === 1 ? `${BATIMENTS[ch.batiment].nom} est construit !` : `${BATIMENTS[ch.batiment].nom} passe au niveau ${n} !`)
    } else restants.push(ch)
  }
  s.camp.chantiers = restants
  return notes
}

// ── Rencontres ──────────────────────────────────────────────
// Chasse libre : des rencontres au hasard dans la zone de la ville,
// pour s'entraîner. Le parcours reste la voie principale.
export function rencontreSauvage(s) {
  const zone = villeCourante(s).zone
  const niveaux = zone.niveaux
  const n = tiragePondere(zone.groupe)
  // Le niveau des monstres suit celui de l'équipe, dans les limites de la zone
  const moy = Math.round(ORDRE_EQUIPE.reduce((t, c) => t + s.heros[c].niveau, 0) / ORDRE_EQUIPE.length)
  const centre = Math.max(niveaux[0], Math.min(niveaux[1], moy))
  return Array.from({ length: n }, () => ({
    id: tiragePondere(zone.monstres),
    niveau: Math.max(niveaux[0], Math.min(niveaux[1], centre + entre(-1, 1) - (n > 1 ? 1 : 0))),
  }))
}

export function rencontreArene(s, ville = s.ville) {
  const a = VILLES[ville].arene
  return [{ id: a.boss, niveau: a.niveau }]
}

// ── Parcours ────────────────────────────────────────────────
// Une zone (ou une route) est une suite de 6 cases jouées dans l'ordre.
// Les PV et PM ne remontent pas entre les combats : seul le feu de camp
// soigne. En cas de défaite ou de retour en arrière, on reprend au dernier
// point de passage (départ, feu de camp, ou champion une fois l'élite battue).
// Chaque case ne rapporte sa récompense qu'une seule fois.

export function nouveauParcours() {
  return { index: 0, checkpoint: 0, recompenses: [] }
}

function terminerParcours(p, def) {
  p.index = def.length
  p.checkpoint = def.length
  p.recompenses = def.map((_, i) => i)
}

// cle : identifiant d'une ville, ou 'route' pendant un voyage
export function defParcours(s, cle) {
  if (cle === 'route') return s.voyage ? VOYAGES[`${s.voyage.de}>${s.voyage.vers}`].parcours : []
  return VILLES[cle].parcours
}

export function etatParcours(s, cle) {
  if (cle === 'route') return s.voyage?.route || null
  if (!s.parcours[cle]) s.parcours[cle] = nouveauParcours()
  return s.parcours[cle]
}

export function caseCourante(s, cle) {
  const p = etatParcours(s, cle)
  const def = defParcours(s, cle)
  return p && p.index < def.length ? { ...def[p.index], index: p.index } : null
}

export const parcoursTermine = (s, cle) => !caseCourante(s, cle)

// Progression perdue si on rebrousse chemin maintenant
export const progressionEnJeu = (s, cle) => {
  const p = etatParcours(s, cle)
  return p ? p.index - p.checkpoint : 0
}

export function ennemisCase(s, cle) {
  const c = caseCourante(s, cle)
  if (!c) return []
  if (c.t === 'champion') return rencontreArene(s, cle)
  return (c.ennemis || []).map(([id, niveau, elite]) => ({ id, niveau, elite: !!elite }))
}

// Feu de camp : soigne la moitié des PV et PM (relève les K.O.) et sert de point de passage
export function feuDeCamp(s, cle) {
  const c = caseCourante(s, cle)
  if (!c || c.t !== 'feu') return false
  for (const k of ORDRE_EQUIPE) {
    const h = s.heros[k]
    const st = statsHeros(h, s.inventaire, s.camp)
    h.pv = Math.min(st.pv, h.pv + Math.round(st.pv * SOIN_FEU))
    h.pm = Math.min(st.pm, h.pm + Math.round(st.pm * SOIN_FEU))
  }
  const p = etatParcours(s, cle)
  p.index += 1
  p.checkpoint = p.index
  return true
}

// Rebrousser chemin : retour au dernier point de passage
export function rebrousser(s, cle) {
  const p = etatParcours(s, cle)
  if (p) p.index = p.checkpoint
}

function avancer(s, cle) {
  const p = etatParcours(s, cle)
  const def = defParcours(s, cle)
  const fait = def[p.index]
  const premiere = !p.recompenses.includes(p.index)
  if (premiere) p.recompenses.push(p.index)
  p.index += 1
  // Après l'élite, le champion devient un point de passage ; une fois le
  // champion battu, le parcours est terminé
  if (fait.t === 'elite' || fait.t === 'champion') p.checkpoint = p.index
  return premiere
}

export function herosPourCombat(s) {
  const r = s.repas ? REPAS[s.repas.id].effet : {}
  return ORDRE_EQUIPE.map((c) => {
    const h = s.heros[c]
    const st = statsHeros(h, s.inventaire, s.camp)
    for (const k of ['pv', 'atq', 'mag', 'vit']) if (r[k]) st[k] = Math.round(st[k] * r[k])
    if (r.crit) st.crit += r.crit
    const pv = r.pv && h.pv >= statsHeros(h, s.inventaire, s.camp).pv ? st.pv : h.pv
    return { classe: c, niveau: h.niveau, pv, pm: h.pm, stats: st, capacites: h.capacites }
  })
}

// ── Fin de combat ───────────────────────────────────────────
// contexte : { type: 'parcours', cle } | { type: 'chasse' }
export function finCombat(s, bilan, contexte = { type: 'chasse' }) {
  s.sac = { ...bilan.sac }
  for (const k of Object.keys(s.sac)) if (s.sac[k] <= 0) delete s.sac[k]
  for (const h of bilan.heros) {
    s.heros[h.classe].pv = h.pv
    s.heros[h.classe].pm = h.pm
    bornerHeros(s.heros[h.classe], s.inventaire, s.camp)
  }
  if (s.repas && bilan.issue !== 'fuite') {
    s.repas.combats -= 1
    if (s.repas.combats <= 0) s.repas = null
  }
  s.stats.combats += 1
  const enParcours = contexte.type === 'parcours'
  const caseJouee = enParcours ? caseCourante(s, contexte.cle) : null
  const rapport = { issue: bilan.issue, xp: 0, or: 0, objets: [], consommables: {}, niveaux: [], eclat: null, contexte, caseJouee, dejaRecompense: false }

  if (bilan.issue === 'defaite') {
    s.stats.defaites += 1
    for (const c of ORDRE_EQUIPE) soignerHeros(s.heros[c], s.inventaire, s.camp)
    if (enParcours) {
      rapport.recul = progressionEnJeu(s, contexte.cle)
      rebrousser(s, contexte.cle)
    }
    return rapport
  }
  if (bilan.issue !== 'victoire') return rapport
  s.stats.victoires += 1
  for (const v of bilan.vaincus) s.bestiaire[v.id] = (s.bestiaire[v.id] || 0) + 1

  if (enParcours) {
    const premiere = avancer(s, contexte.cle)
    if (!premiere) {
      rapport.dejaRecompense = true
      return rapport
    }
  }

  let xp = 0
  let or = 0
  let nivMax = 1
  for (const v of bilan.vaincus) {
    const m = MONSTRES[v.id]
    const bonus = v.elite ? 2 : 1
    xp += m.xp * (1 + 0.3 * (v.niveau - 1)) * REGLAGES.multXp * bonus
    or += m.or * (1 + 0.2 * (v.niveau - 1)) * (0.8 + Math.random() * 0.4) * bonus
    nivMax = Math.max(nivMax, v.niveau)
  }
  // La chasse libre rapporte moins : le parcours reste la voie principale
  if (contexte.type === 'chasse') {
    xp *= 0.7
    or *= 0.7
  }
  rapport.xp = Math.round(xp)
  rapport.or = Math.round(or)
  s.or += rapport.or

  for (const h of bilan.heros) {
    const heros = s.heros[h.classe]
    const gains = gagnerXp(heros, h.ko ? xp / 2 : xp, s.inventaire, s.camp)
    for (const g of gains) rapport.niveaux.push({ classe: h.classe, ...g })
  }

  const genre = caseJouee?.t
  if (genre === 'champion') {
    const boss = bilan.vaincus.find((v) => MONSTRES[v.id].boss)
    if (boss && !s.eclats.includes(boss.id)) {
      s.eclats.push(boss.id)
      rapport.eclat = boss.id
    }
    const rar = Math.random() < 0.25 ? 'legendaire' : 'epique'
    rapport.objets.push(genererObjet({ niveau: nivMax, rarete: rar }))
    rapport.objets.push(genererObjet({ niveau: nivMax, rarete: tirerRarete(25) }))
    rapport.consommables.plume = 1
  } else if (genre === 'elite') {
    const rar = tirerRarete(30)
    rapport.objets.push(genererObjet({ niveau: nivMax, rarete: rar === 'commun' ? 'rare' : rar }))
    rapport.consommables[nivMax >= 8 ? 'superpotion' : 'potion'] = 1
  } else {
    const chance = (0.28 + 0.07 * bilan.vaincus.length) * (contexte.type === 'chasse' ? 0.5 : 1)
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
  for (const c of ORDRE_EQUIPE) soignerHeros(s.heros[c], s.inventaire, s.camp)
}

export function equipeEnForme(s) {
  return ORDRE_EQUIPE.every((c) => {
    const h = s.heros[c]
    const st = statsHeros(h, s.inventaire, s.camp)
    return h.pv >= st.pv && h.pm >= st.pm
  })
}

export function utiliserConsommable(s, id, classe) {
  const o = CONSOMMABLES[id]
  const h = s.heros[classe]
  if (!o || !(s.sac[id] > 0)) return false
  const st = statsHeros(h, s.inventaire, s.camp)
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
  for (const c of ORDRE_EQUIPE) bornerHeros(s.heros[c], s.inventaire, s.camp)
  return true
}

export function desequiper(s, classe, slot) {
  s.heros[classe].equip[slot] = null
  bornerHeros(s.heros[classe], s.inventaire, s.camp)
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
// La route vers la ville suivante est un parcours comme les autres :
// on arrive dès qu'on l'a traversée. Aucune attente.
export function infoVoyage(s) {
  const suiv = villeCourante(s).suivante
  if (!suiv) return null
  return { vers: suiv, ...VOYAGES[`${s.ville}>${suiv}`] }
}

export function partirEnVoyage(s) {
  const v = infoVoyage(s)
  if (!v || !areneBattue(s) || s.voyage) return false
  s.voyage = { de: s.ville, vers: v.vers, route: nouveauParcours() }
  return true
}

// On peut faire demi-tour tant que la route n'est pas commencée
export function annulerVoyage(s) {
  if (!s.voyage || s.voyage.route.index > 0) return false
  s.voyage = null
  return true
}

export function voyageTermine(s) {
  return !!s.voyage && caseCourante(s, 'route')?.t === 'arrivee'
}

export function arriver(s) {
  if (!voyageTermine(s)) return null
  const v = s.voyage
  s.ville = v.vers
  if (!s.villesVisitees.includes(v.vers)) s.villesVisitees.push(v.vers)
  if (!s.parcours[v.vers]) s.parcours[v.vers] = nouveauParcours()
  s.voyage = null
  seReposer(s)
  return { ville: v.vers }
}

// ── Village ─────────────────────────────────────────────────
export function enStock(s, bat) {
  const b = s.camp[bat]
  const def = BATIMENTS[bat]
  if (!def.production || !b.niveau) return 0
  return Math.floor(Math.min(def.capacite[b.niveau], def.production[b.niveau] * heuresJeu(b.collecte)))
}

export function recolter(s, bat) {
  const n = enStock(s, bat)
  if (n <= 0) return 0
  if (bat === 'mine') s.or += n
  if (bat === 'herboristerie') {
    const sup = s.camp.herboristerie.niveau >= 3 ? Math.floor(n / 2) : 0
    if (sup) s.sac.superpotion = (s.sac.superpotion || 0) + sup
    s.sac.potion = (s.sac.potion || 0) + (n - sup)
  }
  s.camp[bat].collecte = maintenant()
  return n
}

export const ouvriers = (s) => 1 + (s.camp.hutte?.niveau >= 1 ? 1 : 0)
export const enChantier = (s, bat) => (s.camp.chantiers || []).find((c) => c.batiment === bat) || null

// Niveau maximal autorisé aujourd'hui : le château plafonne les autres bâtiments
export function plafond(s, bat) {
  const def = BATIMENTS[bat]
  if (bat === 'chateau') return def.max
  return Math.min(def.max, s.camp.chateau.niveau)
}

export function peutAmeliorer(s, bat) {
  const def = BATIMENTS[bat]
  const b = s.camp[bat]
  if (enChantier(s, bat)) return { ok: false, raison: 'Chantier en cours.' }
  if (b.niveau >= def.max) return { ok: false, raison: 'Niveau maximum atteint.' }
  if (!b.niveau && s.camp.chateau.niveau < def.deblocage) return { ok: false, raison: `Château niveau ${def.deblocage} requis.`, verrou: true }
  if (b.niveau >= plafond(s, bat)) return { ok: false, raison: `Améliorez d'abord le château (niveau ${b.niveau + 1}).` }
  if ((s.camp.chantiers || []).length >= ouvriers(s)) return { ok: false, raison: ouvriers(s) > 1 ? 'Vos deux ouvriers sont occupés.' : 'Votre ouvrier est occupé. La Hutte du bâtisseur en ajoute un second.' }
  const cout = def.cout[b.niveau + 1]
  if (s.or < cout) return { ok: false, raison: `Il faut ${cout} or.`, cout }
  return { ok: true, cout }
}

export function ameliorer(s, bat) {
  const p = peutAmeliorer(s, bat)
  if (!p.ok) return false
  if (BATIMENTS[bat].production && s.camp[bat].niveau) recolter(s, bat)
  s.or -= p.cout
  const duree = BATIMENTS[bat].duree[s.camp[bat].niveau + 1]
  s.camp.chantiers = [...(s.camp.chantiers || []), { batiment: bat, debut: maintenant(), fin: maintenant() + minutesEnMs(duree) }]
  return true
}

export function progressionAventure(s) {
  return { eclats: s.eclats.length, total: ORDRE_VILLES.length }
}

// ── Auberge : repos et repas gratuit au choix ───────────────
export function prendreRepas(s, id) {
  if (!REPAS[id]) return false
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
    if (h.capacites.length >= maxCapacites(s.camp)) return false
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
    const tirage = tirerRarete(b.bonus || 0)
    const rar = b.objet === 'epique' ? (Math.random() < 0.25 ? 'legendaire' : 'epique') : tirage === 'commun' ? 'rare' : tirage
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
  for (const k of ORDRE_EQUIPE) bornerHeros(s.heros[k], s.inventaire, s.camp)
  return true
}

// ── Défi du jour ────────────────────────────────────────────
// Un champion déjà battu et une règle, tirés de la date : chaque jour
// un nouveau défi. Il ne coûte rien (ni PV, ni objets) et ne rapporte
// qu'un record local et une petite prime d'or une fois par jour.
export function dateDuJour(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function defiDuJour(s, date = dateDuJour()) {
  const battus = ORDRE_VILLES.filter((v) => s.eclats.includes(VILLES[v].arene.boss))
  if (!battus.length) return null
  const rng = graine(hacher('defi:' + date))
  const ville = battus[Math.floor(rng() * battus.length)]
  const cles = Object.keys(REGLES_DEFI)
  const regle = cles[Math.floor(rng() * cles.length)]
  const a = VILLES[ville].arene
  const moy = Math.round(ORDRE_EQUIPE.reduce((t, c) => t + s.heros[c].niveau, 0) / ORDRE_EQUIPE.length)
  const niveau = Math.max(a.niveau, moy) + NIVEAU_BONUS_DEFI
  const ennemis = [{ id: a.boss, niveau }]
  if (regle === 'renfort') {
    const zone = VILLES[ville].zone.monstres
    ennemis.push({ id: zone[Math.floor(rng() * zone.length)][0], niveau: niveau - 1, elite: true })
  }
  const record = s.defi?.date === date ? s.defi : null
  return { date, ville, regle, ennemis, record, prime: 40 * battus.length }
}

// Équipe en pleine forme pour le défi, sans toucher à la partie
export function herosPourDefi(s) {
  return herosPourCombat(s).map((h) => ({ ...h, pv: h.stats.pv, pm: h.stats.pm }))
}

export function finDefi(s, bilan, defi) {
  const r = { issue: bilan.issue, tours: bilan.tours, record: false, or: 0 }
  if (bilan.issue !== 'victoire') return r
  if (!s.defi || s.defi.date !== defi.date) s.defi = { date: defi.date, meilleur: null, prime: false }
  if (s.defi.meilleur === null || bilan.tours < s.defi.meilleur) {
    r.record = true
    s.defi.meilleur = bilan.tours
  }
  if (!s.defi.prime) {
    s.defi.prime = true
    s.or += defi.prime
    r.or = defi.prime
  }
  return r
}
