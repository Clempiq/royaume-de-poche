// Objets : consommables et équipement généré (loot façon Diablo).

export const CONSOMMABLES = {
  potion: { nom: 'Potion', desc: 'Rend 45 PV à un héros.', prix: 15, effet: { pv: 45 }, icone: '🧪' },
  superpotion: { nom: 'Super potion', desc: 'Rend 140 PV à un héros.', prix: 55, effet: { pv: 140 }, icone: '⚗️' },
  ether: { nom: 'Éther', desc: 'Rend 15 PM à un héros.', prix: 25, effet: { pm: 15 }, icone: '🔷' },
  superether: { nom: 'Super éther', desc: 'Rend 45 PM à un héros.', prix: 75, effet: { pm: 45 }, icone: '💠' },
  plume: { nom: 'Plume de phénix', desc: 'Relève un héros K.O. avec 40 % de ses PV.', prix: 120, effet: { reanime: 0.4 }, icone: '🪶' },
  antibrulure: { nom: 'Baume frais', desc: 'Guérit la brûlure et rend 20 PV.', prix: 12, effet: { pv: 20, soigneBrulure: true }, icone: '🍃' },
}

export const RARETES = {
  commun: { nom: 'Commun', couleur: '#8d8577', mult: 1, affixes: 0, prix: 1 },
  rare: { nom: 'Rare', couleur: '#2f7fe0', mult: 1.15, affixes: 1, prix: 2.5 },
  epique: { nom: 'Épique', couleur: '#9b4fe0', mult: 1.3, affixes: 2, prix: 6 },
  legendaire: { nom: 'Légendaire', couleur: '#e39a12', mult: 1.5, affixes: 3, prix: 15 },
}

export const EMPLACEMENTS = {
  arme: { nom: 'Arme', icone: '⚔️' },
  armure: { nom: 'Armure', icone: '🛡️' },
  accessoire: { nom: 'Objet tenu', icone: '💍' },
}

// Bases d'objets : noms par palier de niveau (0 à 3)
export const BASES = {
  epee: { slot: 'arme', classe: 'guerrier', icone: '🗡️', noms: ['Épée courte', 'Épée longue', 'Lame d\'acier', 'Grande épée'] },
  sceptre: { slot: 'arme', classe: 'mage', icone: '🪄', noms: ['Bâton noueux', 'Sceptre de cristal', 'Sceptre runique', 'Sceptre royal'] },
  arc: { slot: 'arme', classe: 'rodeur', icone: '🏹', noms: ['Arc de chasse', 'Arc court', 'Arc long', 'Arc composite'] },
  armure: { slot: 'armure', icone: '🥋', noms: ['Tunique', 'Veste de cuir', 'Cotte de mailles', 'Armure d\'écailles'] },
  anneau: { slot: 'accessoire', icone: '💍', noms: ['Anneau de cuivre', 'Anneau d\'argent', 'Anneau d\'or', 'Anneau de platine'] },
  amulette: { slot: 'accessoire', icone: '📿', noms: ['Pendentif', 'Amulette', 'Médaillon', 'Talisman'] },
  // Objets tenus qui renforcent un type, comme dans Pokémon
  charbon: { slot: 'accessoire', icone: '🔥', elem: 'feu', noms: ['Charbon ardent', 'Charbon ardent', 'Braise éternelle', 'Cœur de volcan'] },
  perle: { slot: 'accessoire', icone: '🫧', elem: 'eau', noms: ['Perle d\'eau', 'Perle d\'eau', 'Perle des abysses', 'Larme de l\'océan'] },
  graine: { slot: 'accessoire', icone: '🌱', elem: 'plante', noms: ['Graine vivace', 'Graine vivace', 'Gland millénaire', 'Cœur de la forêt'] },
  ambre: { slot: 'accessoire', icone: '⚡', elem: 'foudre', noms: ['Pierre d\'ambre', 'Pierre d\'ambre', 'Ambre crépitante', 'Éclat d\'orage'] },
  galet: { slot: 'accessoire', icone: '🪨', elem: 'roche', noms: ['Galet runique', 'Galet runique', 'Pierre ancienne', 'Cœur de montagne'] },
}

// Affixes tirés au hasard selon la rareté
export const AFFIXES = [
  { id: 'atq', stat: 'atq', suffixe: 'du lion', val: (n) => 2 + n * 0.8 },
  { id: 'mag', stat: 'mag', suffixe: 'du sage', val: (n) => 2 + n * 0.8 },
  { id: 'def', stat: 'def', suffixe: 'du rempart', val: (n) => 2 + n * 0.7 },
  { id: 'pv', stat: 'pv', suffixe: 'de l\'ours', val: (n) => 6 + n * 3 },
  { id: 'pm', stat: 'pm', suffixe: 'de la lune', val: (n) => 3 + n * 0.8 },
  { id: 'vit', stat: 'vit', suffixe: 'du vent', val: (n) => 1 + n * 0.5 },
  { id: 'crit', stat: 'crit', suffixe: 'du faucon', val: (n) => 3 + n * 0.3 },
  { id: 'feu', elem: 'feu', suffixe: 'de braise', val: (n) => 10 + n, armeSeulement: true },
  { id: 'eau', elem: 'eau', suffixe: 'des marées', val: (n) => 10 + n, armeSeulement: true },
  { id: 'plante', elem: 'plante', suffixe: 'des ronces', val: (n) => 10 + n, armeSeulement: true },
  { id: 'foudre', elem: 'foudre', suffixe: 'de l\'orage', val: (n) => 10 + n, armeSeulement: true },
  { id: 'roche', elem: 'roche', suffixe: 'du roc', val: (n) => 10 + n, armeSeulement: true },
]

export const NOMS_STATS = {
  puiss: 'Puissance', pv: 'PV', pm: 'PM', atq: 'Attaque', mag: 'Magie', def: 'Défense', vit: 'Vitesse', crit: 'Critique',
}

export const FORGE_MAX = 5
