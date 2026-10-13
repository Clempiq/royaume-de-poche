import { AFFIXES, BASES, RARETES, FORGE_MAX, POUVOIRS, POUVOIR_PAR_BASE } from '../data/items.js'
import { tiragePondere } from './util.js'

let compteur = 0
const nouvelId = () => `o${Date.now().toString(36)}${(compteur++).toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`

export function tirerRarete(bonus = 0, rng = Math.random) {
  // bonus : 0 en zone, plus élevé pour les boss et la boutique
  const r = rng() * 100 - bonus
  if (r < 2) return 'legendaire'
  if (r < 12) return 'epique'
  if (r < 40) return 'rare'
  return 'commun'
}

// Statistiques de base selon le type d'objet. Les armes ont une
// « puissance » qui s'ajoute à chaque attaque et capacité du héros.
function statsDeBase(base, n) {
  switch (base) {
    case 'epee': return { puiss: 5 + n * 1.9 }
    case 'arc': return { puiss: 5 + n * 1.8, crit: 3 }
    case 'sceptre': return { puiss: 5 + n * 1.9, pm: 2 + n * 0.5 }
    case 'armure': return { def: 3 + n * 1.3, pv: 5 + n * 3 }
    case 'anneau': return { atq: 1 + n * 0.6, mag: 1 + n * 0.6 }
    case 'amulette': return { pv: 4 + n * 2.4, def: 1 + n * 0.5 }
    default: return {}
  }
}

const POIDS_BASES = [['epee', 2], ['sceptre', 2], ['arc', 2], ['armure', 3], ['anneau', 1], ['amulette', 1], ['charbon', 0.5], ['perle', 0.5], ['graine', 0.5], ['ambre', 0.5], ['galet', 0.5]]

function tirer(paires, rng) {
  if (rng === Math.random) return tiragePondere(paires)
  const total = paires.reduce((s, [, p]) => s + p, 0)
  let x = rng() * total
  for (const [v, p] of paires) {
    x -= p
    if (x <= 0) return v
  }
  return paires[0][0]
}

function tirerAffixes(o, rng) {
  const def = BASES[o.base]
  const rar = RARETES[o.rarete]
  const pool = AFFIXES.filter((a) => (!a.armeSeulement || def.slot === 'arme' || def.slot === 'accessoire') && a.elem !== def.elem)
  const choisis = []
  // Une arme à pouvoir a un bonus de moins : le pouvoir compte pour beaucoup
  const nbAffixes = o.pouvoir ? rar.affixes - 1 : rar.affixes
  while (choisis.length < nbAffixes && pool.length) choisis.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
  o.stats = {}
  for (const [k, v] of Object.entries(statsDeBase(o.base, o.niveau))) o.stats[k] = Math.round(v * rar.mult)
  o.elem = {}
  if (def.elem) o.elem[def.elem] = Math.round((12 + o.niveau * 1.2) * rar.mult)
  for (const a of choisis) {
    const v = Math.round(a.val(o.niveau) * (0.8 + rng() * 0.4))
    if (a.elem) o.elem[a.elem] = (o.elem[a.elem] || 0) + v
    else o.stats[a.stat] = (o.stats[a.stat] || 0) + v
  }
  const palier = Math.min(3, Math.floor(o.niveau / 5))
  o.nom = o.pouvoir ? POUVOIRS[o.pouvoir].nom : def.noms[palier] + (choisis[0] && !def.elem ? ' ' + choisis[0].suffixe : '')
}

// Donne son pouvoir à une arme légendaire (aussi pour les anciennes sauvegardes)
export function donnerPouvoir(o) {
  if (o.rarete === 'legendaire' && POUVOIR_PAR_BASE[o.base] && !o.pouvoir) {
    o.pouvoir = POUVOIR_PAR_BASE[o.base]
    o.nom = POUVOIRS[o.pouvoir].nom
  }
  return o
}

export function genererObjet({ niveau, rarete, base, rng = Math.random }) {
  const n = Math.max(1, niveau)
  const r = rarete || tirerRarete(0, rng)
  const b = base || tirer(POIDS_BASES, rng)
  const def = BASES[b]
  const o = {
    id: nouvelId(),
    base: b,
    slot: def.slot,
    classe: def.classe || null,
    rarete: r,
    niveau: n,
    forge: 0,
    prix: Math.round((10 + n * 6) * RARETES[r].prix),
  }
  if (r === 'legendaire' && POUVOIR_PAR_BASE[b]) o.pouvoir = POUVOIR_PAR_BASE[b]
  tirerAffixes(o, rng)
  return o
}

// Atelier d'enchantement : on relance les bonus, la base et la rareté restent
export function reenchanter(o) {
  tirerAffixes(o, Math.random)
}
export const coutEnchantement = (o) => Math.round(o.prix * 0.7 + 20)

// Statistiques réelles d'un objet, bonus de forge compris (+12 % par niveau)
export function statsObjet(o) {
  const m = 1 + 0.12 * (o.forge || 0)
  const s = {}
  for (const [k, v] of Object.entries(o.stats)) s[k] = Math.round(v * m)
  return s
}
export function elemObjet(o) {
  const m = 1 + 0.12 * (o.forge || 0)
  const e = {}
  for (const [k, v] of Object.entries(o.elem || {})) e[k] = Math.round(v * m)
  return e
}

export const prixVente = (o) => Math.max(1, Math.round(o.prix * (1 + 0.2 * (o.forge || 0)) / 3))
export const coutForge = (o) => Math.round(o.prix * 0.6 * ((o.forge || 0) + 1))
export const peutForger = (o, niveauForge) => (o.forge || 0) < Math.min(FORGE_MAX, niveauForge)
