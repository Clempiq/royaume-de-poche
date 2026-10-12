// Table des types : multiplicateur de dégâts selon le type de l'attaque
// (ligne) et le type du défenseur (colonne). Absent = x1.
// Les héros n'ont pas de type : ils subissent toujours x1.

export const TYPES = {
  neutre: { nom: 'Neutre', couleur: '#9a8f7e', icone: '✦' },
  feu: { nom: 'Feu', couleur: '#ef6a2e', icone: '🔥' },
  eau: { nom: 'Eau', couleur: '#2f8fe0', icone: '💧' },
  plante: { nom: 'Plante', couleur: '#4fae3c', icone: '🌿' },
  foudre: { nom: 'Foudre', couleur: '#e8b51f', icone: '⚡' },
  roche: { nom: 'Roche', couleur: '#8a6f55', icone: '🪨' },
}

const TABLE = {
  neutre: { roche: 0.5 },
  feu: { plante: 2, eau: 0.5, roche: 0.5, feu: 0.5 },
  eau: { feu: 2, roche: 2, plante: 0.5, eau: 0.5 },
  plante: { eau: 2, roche: 2, feu: 0.5, plante: 0.5 },
  foudre: { eau: 2, plante: 0.5, roche: 0.5, foudre: 0.5 },
  roche: { feu: 2, foudre: 2, roche: 0.5 },
}

export function efficacite(typeAttaque, typeDefenseur) {
  if (!typeDefenseur) return 1
  return TABLE[typeAttaque]?.[typeDefenseur] ?? 1
}

// Pour l'écran d'aide : forces et faiblesses de chaque type.
export function resumeType(t) {
  const fortContre = Object.entries(TABLE[t] || {}).filter(([, m]) => m > 1).map(([k]) => k)
  const faibleContre = Object.keys(TABLE).filter((a) => (TABLE[a][t] ?? 1) > 1)
  return { fortContre, faibleContre }
}
