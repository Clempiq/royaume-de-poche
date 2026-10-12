// Monstres sauvages et champions d'arène.
// Les statistiques indiquées sont celles du niveau 1 ; "croissance"
// s'ajoute à chaque niveau supplémentaire.

const C = (pv, atq, mag, def, vit) => ({ pv, atq, mag, def, vit })

export const MONSTRES = {
  // ── Prés Moelleux ───────────────────────────────────────────
  grignaud: {
    nom: 'Grignaud', image: 'm-grignaud', type: 'neutre',
    desc: 'Rat chapardeur. Il vole les glands, puis tout le reste.',
    base: C(26, 9, 3, 6, 11), croissance: C(7, 2.2, 0.6, 1.4, 1.5),
    xp: 9, or: 6,
    attaques: [
      { nom: 'Morsure', type: 'neutre', puissance: 100, stat: 'atq', poids: 3 },
      { nom: 'Coup de gland', type: 'neutre', puissance: 120, stat: 'atq', poids: 1 },
    ],
  },
  champi: {
    nom: 'Champi', image: 'm-champi', type: 'plante',
    desc: 'Champignon grognon. Ses spores donnent le tournis.',
    base: C(30, 8, 7, 7, 6), croissance: C(8, 2, 1.6, 1.6, 0.9),
    xp: 10, or: 5,
    attaques: [
      { nom: 'Coup de chapeau', type: 'plante', puissance: 100, stat: 'atq', poids: 3 },
      { nom: 'Spores', type: 'plante', puissance: 60, stat: 'mag', poids: 1, effets: [{ kind: 'etourdi', chance: 0.25 }] },
    ],
  },
  gloupi: {
    nom: 'Gloupi', image: 'm-gloupi', type: 'eau',
    desc: 'Slime d\'eau farceur. Se recolle toujours.',
    base: C(28, 6, 9, 6, 8), croissance: C(8, 1.4, 2.1, 1.3, 1.2),
    xp: 10, or: 5,
    attaques: [
      { nom: 'Bulle', type: 'eau', puissance: 100, stat: 'mag', poids: 3 },
      { nom: 'Gloup', cible: 'soi', poids: 1, effets: [{ kind: 'soin', puissance: 80 }], seulementSiBlesse: true },
    ],
  },
  bzzou: {
    nom: 'Bzzou', image: 'm-bzzou', type: 'foudre',
    desc: 'Bourdon électrique. Pique d\'abord, réfléchit jamais.',
    base: C(22, 10, 6, 5, 14), croissance: C(6, 2.4, 1.2, 1.1, 1.8),
    xp: 11, or: 7,
    attaques: [
      { nom: 'Dard électrique', type: 'foudre', puissance: 100, stat: 'atq', poids: 3 },
      { nom: 'Bzzzt', type: 'foudre', puissance: 70, stat: 'atq', poids: 1, effets: [{ kind: 'etourdi', chance: 0.2 }] },
    ],
  },

  // ── Falaises Salées ─────────────────────────────────────────
  crabouille: {
    nom: 'Crabouille', image: 'm-crabouille', type: 'eau',
    desc: 'Crabe vantard. Sa grosse pince est surtout pour la frime. Surtout.',
    base: C(32, 10, 5, 10, 7), croissance: C(8, 2.3, 1, 2, 1),
    xp: 12, or: 8,
    attaques: [
      { nom: 'Pince', type: 'eau', puissance: 105, stat: 'atq', poids: 3 },
      { nom: 'Carapace', cible: 'soi', poids: 1, effets: [{ kind: 'buff', stat: 'def', mult: 1.5, tours: 2 }] },
    ],
  },
  grognard: {
    nom: 'Caillou-Grogne', image: 'm-grognard', type: 'roche',
    desc: 'Petit golem boudeur. Personne ne sait pourquoi il boude.',
    base: C(36, 11, 3, 13, 4), croissance: C(9, 2.4, 0.6, 2.4, 0.6),
    xp: 13, or: 9,
    attaques: [
      { nom: 'Poing de pierre', type: 'roche', puissance: 105, stat: 'atq', poids: 3 },
      { nom: 'Éboulement', type: 'roche', puissance: 60, stat: 'atq', cible: 'ennemis', poids: 1 },
    ],
  },
  goeland: {
    nom: 'Goéland pirate', image: 'm-goeland', type: 'neutre',
    desc: 'Vole les poissons, les frites et les chapeaux.',
    base: C(26, 11, 4, 6, 13), croissance: C(7, 2.5, 0.8, 1.3, 1.8),
    xp: 12, or: 12,
    attaques: [
      { nom: 'Piqué', type: 'neutre', puissance: 110, stat: 'atq', poids: 3 },
      { nom: 'Coup de poisson', type: 'eau', puissance: 90, stat: 'atq', poids: 1 },
    ],
  },
  meduzz: {
    nom: 'Méduzz', image: 'm-meduzz', type: 'foudre',
    desc: 'Méduse somnolente. La réveiller est une mauvaise idée.',
    base: C(28, 5, 11, 7, 9), croissance: C(7, 1, 2.5, 1.4, 1.2),
    xp: 13, or: 9,
    attaques: [
      { nom: 'Décharge', type: 'foudre', puissance: 95, stat: 'mag', poids: 3, effets: [{ kind: 'etourdi', chance: 0.15 }] },
      { nom: 'Tentacules', type: 'foudre', puissance: 55, stat: 'mag', cible: 'ennemis', poids: 1 },
    ],
  },

  // ── Pentes Fumantes ─────────────────────────────────────────
  braisillon: {
    nom: 'Braisillon', image: 'm-braisillon', type: 'feu',
    desc: 'Lutin de braise. Adore mettre le feu, surtout aux chaussettes.',
    base: C(28, 7, 11, 7, 12), croissance: C(7, 1.5, 2.6, 1.4, 1.6),
    xp: 14, or: 10,
    attaques: [
      { nom: 'Flammèche', type: 'feu', puissance: 100, stat: 'mag', poids: 3, effets: [{ kind: 'brulure', chance: 0.3, tours: 3 }] },
      { nom: 'Coup de torche', type: 'feu', puissance: 110, stat: 'atq', poids: 1 },
    ],
  },
  rocaille: {
    nom: 'Rocaille', image: 'm-rocaille', type: 'roche',
    desc: 'Tatou volcanique. Se roule en boule et fonce dans le tas.',
    base: C(40, 11, 3, 14, 5), croissance: C(10, 2.5, 0.6, 2.6, 0.7),
    xp: 15, or: 11,
    attaques: [
      { nom: 'Roulade', type: 'roche', puissance: 110, stat: 'atq', poids: 3 },
      { nom: 'Se recroqueviller', cible: 'soi', poids: 1, effets: [{ kind: 'buff', stat: 'def', mult: 1.6, tours: 2 }] },
    ],
  },
  fumeron: {
    nom: 'Fumeron', image: 'm-fumeron', type: 'feu',
    desc: 'Nuage de fumée moqueur. Il sent le feu de cheminée.',
    base: C(26, 5, 10, 6, 10), croissance: C(7, 1, 2.4, 1.3, 1.4),
    xp: 14, or: 10,
    attaques: [
      { nom: 'Nuage brûlant', type: 'feu', puissance: 55, stat: 'mag', cible: 'ennemis', poids: 2, effets: [{ kind: 'brulure', chance: 0.15, tours: 2 }] },
      { nom: 'Rond de fumée', type: 'neutre', puissance: 90, stat: 'mag', poids: 2 },
    ],
  },
  ronceloup: {
    nom: 'Ronceloup', image: 'm-ronceloup', type: 'plante',
    desc: 'Loup de ronces. Il a des épines partout, même dans le caractère.',
    base: C(30, 12, 4, 8, 12), croissance: C(8, 2.7, 0.8, 1.6, 1.6),
    xp: 15, or: 10,
    attaques: [
      { nom: 'Morsure épineuse', type: 'plante', puissance: 110, stat: 'atq', poids: 3 },
      { nom: 'Hurlement', cible: 'soi', poids: 1, effets: [{ kind: 'buff', stat: 'atq', mult: 1.4, tours: 3 }] },
    ],
  },

  // ── Champions d'arène ───────────────────────────────────────
  champignard: {
    nom: 'Roi Champignard', image: 'b-champignard', type: 'plante', boss: true,
    desc: 'Se croit roi parce qu\'il a trouvé un éclat de sceptre. Il a aussi une moustache, ce qui n\'aide pas.',
    base: C(520, 18, 16, 9, 7), croissance: C(72, 3.8, 3.4, 1.6, 0.8),
    xp: 70, or: 80,
    script: 'champignard',
    attaques: [
      { nom: 'Coup de sceptre-racine', type: 'plante', puissance: 110, stat: 'atq', poids: 3 },
      { nom: 'Fanfare royale', cible: 'soi', poids: 1, effets: [{ kind: 'buff', stat: 'atq', mult: 1.3, tours: 3 }] },
    ],
  },
  bulle: {
    nom: 'Capitaine Bulle', image: 'b-bulle', type: 'eau', boss: true,
    desc: 'Poisson-globe pirate. Quand il est en colère, il gonfle. Il est souvent en colère.',
    base: C(578, 25.3, 25.3, 10, 8), croissance: C(88.4, 4.8, 4.8, 1.8, 0.9),
    xp: 110, or: 140,
    script: 'bulle',
    attaques: [
      { nom: 'Crochet', type: 'neutre', puissance: 110, stat: 'atq', poids: 3 },
      { nom: 'Raz-de-marée', type: 'eau', puissance: 70, stat: 'mag', cible: 'ennemis', poids: 2 },
      { nom: 'Gonflement', cible: 'soi', poids: 1, effets: [{ kind: 'buff', stat: 'def', mult: 1.6, tours: 2 }] },
    ],
  },
  magma: {
    nom: 'Reine Magma', image: 'b-magma', type: 'feu', boss: true,
    desc: 'Salamandre de lave. Exige qu\'on l\'appelle « Votre Incandescence ».',
    base: C(612, 22, 24, 11, 9), croissance: C(95.2, 4.4, 4.6, 1.9, 1),
    xp: 160, or: 220,
    script: 'magma',
    attaques: [
      { nom: 'Morsure de lave', type: 'feu', puissance: 115, stat: 'atq', poids: 3, effets: [{ kind: 'brulure', chance: 0.3, tours: 3 }] },
      { nom: 'Éruption', type: 'feu', puissance: 70, stat: 'mag', cible: 'ennemis', poids: 2, effets: [{ kind: 'brulure', chance: 0.2, tours: 2 }] },
    ],
  },
}

export function statsMonstre(id, niveau) {
  const m = MONSTRES[id]
  const s = {}
  for (const k of Object.keys(m.base)) {
    s[k] = Math.round(m.base[k] + m.croissance[k] * (niveau - 1))
  }
  return s
}
