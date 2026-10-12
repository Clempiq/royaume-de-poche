// Petits outils partagés : hasard, temps de jeu.

export const rand = () => Math.random()
export const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
export const choisir = (liste) => liste[Math.floor(Math.random() * liste.length)]

export function tiragePondere(paires) {
  // paires : [[valeur, poids], ...]
  const total = paires.reduce((s, [, p]) => s + p, 0)
  let r = Math.random() * total
  for (const [v, p] of paires) {
    r -= p
    if (r <= 0) return v
  }
  return paires[paires.length - 1][0]
}

// Générateur pseudo-aléatoire déterministe (pour les boutiques)
export function graine(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hacher(texte) {
  let h = 2166136261
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// ── Temps de jeu ─────────────────────────────────────────────
// Pour tester, ajouter ?vitesse=60 à l'adresse : le temps du jeu
// (voyages, chantiers, production) passe alors 60 fois plus vite.
// ?vitesse=1 remet la vitesse normale.

let VITESSE = 1
try {
  const p = new URLSearchParams(window.location.search).get('vitesse')
  if (p) localStorage.setItem('rdp-vitesse', p)
  VITESSE = Math.max(1, Math.min(3600, Number(localStorage.getItem('rdp-vitesse')) || 1))
} catch {
  VITESSE = 1
}
export const vitesse = () => VITESSE
export const maintenant = () => Date.now()
export const minutesEnMs = (min) => (min * 60000) / VITESSE
// Heures de jeu écoulées entre deux instants réels
export const heuresJeu = (debut, fin = Date.now()) => (Math.max(0, fin - debut) * VITESSE) / 3600000

export function formatDuree(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')}`
  if (m > 0) return `${m} min ${String(sec).padStart(2, '0')}`
  return `${sec} s`
}
