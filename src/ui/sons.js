// Petits bruitages synthétisés (aucun fichier audio à charger).
let ctx = null
let actif = true
try {
  actif = localStorage.getItem('rdp-son') !== '0'
} catch {
  actif = true
}

export const sonActif = () => actif
export function basculerSon() {
  actif = !actif
  try {
    localStorage.setItem('rdp-son', actif ? '1' : '0')
  } catch {
    /* rien */
  }
  return actif
}

function bip(freq, duree, type = 'square', volume = 0.06, glisse = 0, delai = 0) {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  const t = ctx.currentTime + delai
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (glisse) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + glisse), t + duree)
  g.gain.setValueAtTime(volume, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree)
  o.connect(g).connect(ctx.destination)
  o.start(t)
  o.stop(t + duree + 0.02)
}

export function son(nom) {
  if (!actif) return
  try {
    switch (nom) {
      case 'action': bip(520, 0.08, 'triangle', 0.05, 200); break
      case 'objet': bip(700, 0.1, 'sine', 0.06, 300); break
      case 'coup': bip(180, 0.12, 'square', 0.05, -120); break
      case 'super': bip(240, 0.1, 'square', 0.06, -150); bip(120, 0.16, 'sawtooth', 0.04, -60, 0.05); break
      case 'critique': bip(300, 0.08, 'square', 0.06, 400); bip(150, 0.18, 'sawtooth', 0.05, -100, 0.06); break
      case 'soin': bip(660, 0.12, 'sine', 0.05, 0); bip(880, 0.14, 'sine', 0.05, 0, 0.08); break
      case 'ko': bip(300, 0.35, 'triangle', 0.06, -250); break
      case 'victoire': [523, 659, 784, 1047].forEach((f, i) => bip(f, 0.18, 'triangle', 0.06, 0, i * 0.11)); break
      case 'defaite': [392, 330, 262].forEach((f, i) => bip(f, 0.26, 'triangle', 0.05, 0, i * 0.16)); break
      case 'piece': bip(988, 0.06, 'square', 0.04, 0); bip(1319, 0.12, 'square', 0.04, 0, 0.06); break
      case 'niveau': [523, 784, 1047].forEach((f, i) => bip(f, 0.14, 'square', 0.05, 0, i * 0.09)); break
      case 'clic': bip(800, 0.04, 'triangle', 0.03, 0); break
      default: break
    }
  } catch {
    /* audio indisponible */
  }
}
