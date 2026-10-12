import { AFFIXES, BASES, RARETES, FORGE_MAX } from '../data/items.js'
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

function statsDeBase(base, n) {
  switch (base) {
    case 'epee': return { atq: 4 + n * 1.8 }
    case 'arc': return { atq: 4 + n * 1.75, crit: 3 }
    case 'sceptre': return { mag: 4 + n * 1.9, pm: 2 + n * 0.5 }
    case 'armure': return { def: 3 + n * 1.3, pv: 5 + n * 3 }
    case 'anneau': return { atq: 1 + n * 0.6, mag: 1 + n * 0.6 }
    case 'amulette': return { pv: 4 + n * 2.4, def: 1 + n * 0.5 }
    default: return {}
  }
}

export function genererObjet({ niveau, rarete, base, rng = Math.random }) {
  const n = Math.max(1, niveau)
  const r = rarete || tirerRarete(0, rng)
  const b = base || tiragePondereRng([['epee', 2], ['sceptre', 2], ['arc', 2], ['armure', 3], ['anneau', 1.5], ['amulette', 1.5]], rng)
  const def = BASES[b]
  const rar = RARETES[r]
  const stats = {}
  for (const [k, v] of Object.entries(statsDeBase(b, n))) stats[k] = Math.round(v * rar.mult)
  const elem = {}
  const pool = AFFIXES.filter((a) => !a.armeSeulement || def.slot === 'arme')
  const choisis = []
  while (choisis.length < rar.affixes && pool.length) {
    const i = Math.floor(rng() * pool.length)
    choisis.push(pool.splice(i, 1)[0])
  }
  for (const a of choisis) {
    const v = Math.round(a.val(n) * (0.8 + rng() * 0.4))
    if (a.elem) elem[a.elem] = (elem[a.elem] || 0) + v
    else stats[a.stat] = (stats[a.stat] || 0) + v
  }
  const palier = Math.min(3, Math.floor(n / 5))
  let nom = def.noms[palier]
  if (choisis[0]) nom += ' ' + choisis[0].suffixe
  return {
    id: nouvelId(),
    base: b,
    slot: def.slot,
    classe: def.classe || null,
    nom,
    rarete: r,
    niveau: n,
    stats,
    elem,
    forge: 0,
    prix: Math.round((10 + n * 6) * rar.prix),
  }
}

function tiragePondereRng(paires, rng) {
  if (rng === Math.random) return tiragePondere(paires)
  const total = paires.reduce((s, [, p]) => s + p, 0)
  let x = rng() * total
  for (const [v, p] of paires) {
    x -= p
    if (x <= 0) return v
  }
  return paires[0][0]
}

// Statistiques réelles d'un objet, bonus de forge compris (+12 % par niveau)
export function statsObjet(o) {
  const m = 1 + 0.12 * (o.forge || 0)
  const s = {}
  for (const [k, v] of Object.entries(o.stats)) s[k] = Math.round(v * m)
  return s
}

export const prixVente = (o) => Math.max(1, Math.round(o.prix * (1 + 0.2 * (o.forge || 0)) / 3))
export const coutForge = (o) => Math.round(o.prix * 0.6 * ((o.forge || 0) + 1))
export const peutForger = (o, niveauForge) => (o.forge || 0) < Math.min(FORGE_MAX, niveauForge)
