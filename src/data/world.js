// Villes, zones sauvages, arènes, voyages, personnages et histoire.

export const VILLES = {
  brioche: {
    nom: 'Bourg-Brioche',
    image: 'v-brioche',
    accroche: 'Un village qui sent bon le pain chaud et les ennuis.',
    zone: {
      nom: 'Prés Moelleux', image: 'z-pres', niveaux: [1, 4],
      monstres: [['grignaud', 3], ['champi', 3], ['gloupi', 2], ['bzzou', 2]],
      groupe: [[1, 4], [2, 4], [3, 1]],
    },
    arene: { nom: 'Arène des Sporelles', boss: 'champignard', niveau: 6, conseil: 6 },
    pnj: 'miche',
    batiments: ['boulangerie', 'maitre'],
    boutique: ['potion', 'ether', 'plume'],
    suivante: 'gougere',
  },
  gougere: {
    nom: 'Port-Gougère',
    image: 'v-gougere',
    accroche: 'Un port de pêche où même les mouettes ont un casier judiciaire.',
    zone: {
      nom: 'Falaises Salées', image: 'z-falaises', niveaux: [6, 9],
      monstres: [['crabouille', 3], ['grognard', 2], ['goeland', 3], ['meduzz', 2]],
      groupe: [[1, 2], [2, 4], [3, 2]],
    },
    arene: { nom: 'Arène de la Coquille', boss: 'bulle', niveau: 11, conseil: 10 },
    pnj: 'maree',
    batiments: ['port', 'maitre'],
    boutique: ['potion', 'superpotion', 'ether', 'plume', 'antibrulure'],
    suivante: 'cramoisi',
  },
  cramoisi: {
    nom: 'Fort-Cramoisi',
    image: 'v-cramoisi',
    accroche: 'Une forteresse au pied du volcan. On y forge, on y transpire.',
    zone: {
      nom: 'Pentes Fumantes', image: 'z-pentes', niveaux: [11, 14],
      monstres: [['braisillon', 3], ['rocaille', 2], ['fumeron', 2], ['ronceloup', 3]],
      groupe: [[1, 1], [2, 4], [3, 3]],
    },
    arene: { nom: 'Arène d\'Obsidienne', boss: 'magma', niveau: 16, conseil: 15 },
    pnj: 'enclume',
    batiments: ['enchanteur', 'maitre'],
    boutique: ['superpotion', 'ether', 'superether', 'plume', 'antibrulure'],
    suivante: null,
  },
}

export const ORDRE_VILLES = ['brioche', 'gougere', 'cramoisi']

// Durée des voyages, en minutes. Elle augmente au fil de l'aventure :
// le premier trajet sert à découvrir le principe.
export const VOYAGES = {
  'brioche>gougere': { minutes: 15, evenements: 2, nom: 'Chemin des Haies' },
  'gougere>cramoisi': { minutes: 180, evenements: 3, nom: 'Route des Cendres' },
}

export const PNJ = {
  roi: { nom: 'Le roi Pépin', image: 'p-roi' },
  miche: { nom: 'Mère Miche', titre: 'Boulangère et maire', image: 'p-miche' },
  maree: { nom: 'La Vieille Marée', titre: 'Capitaine du port', image: 'p-maree' },
  enclume: { nom: 'Maître Enclume', titre: 'Forgeron du fort', image: 'p-enclume' },
}

// Introduction de l'aventure
export const INTRO = [
  { pnj: 'roi', texte: 'Ah, enfin des héros ! Enfin… des gens avec des épées. Ça ira très bien.' },
  { pnj: 'roi', texte: 'Le Sceptre des Saisons, trésor du Royaume de Poche, s\'est brisé. J\'ai trébuché. Sur le tapis. C\'est arrivé à tout le monde.' },
  { pnj: 'roi', texte: 'Les éclats se sont envolés aux quatre coins du royaume. Les monstres qui les ont ramassés sont devenus énormes, grincheux et très fiers d\'eux.' },
  { pnj: 'roi', texte: 'Chacun s\'est installé dans une arène et se fait appeler « champion ». Le premier est ici même, à Bourg-Brioche.' },
  { pnj: 'roi', texte: 'Rapportez-moi les éclats. Entraînez-vous dans les prés, achetez de quoi vous soigner chez Mère Miche, et surtout… ne trébuchez pas.' },
]

// Dialogues des personnages : avant et après la victoire dans l'arène
export const DIALOGUES = {
  miche: {
    avant: [
      'Bienvenue à Bourg-Brioche, mes petits ! Ici, on règle tout autour d\'une brioche.',
      'Le Roi Champignard s\'est installé dans l\'arène. Il exige une brioche par jour. Une brioche ! Par jour !',
      'Un conseil de boulangère : les champignons détestent le feu. Votre petite mage devrait s\'en souvenir.',
      'Si vous êtes fatigués, l\'auberge est gratuite pour les héros. Je suis maire, c\'est moi qui décide.',
    ],
    apres: [
      'Vous l\'avez battu ! Ce soir, brioches gratuites pour tout le monde. Sauf pour lui.',
      'La route vers Port-Gougère passe par le Chemin des Haies. C\'est un peu long, mais vous trouverez sûrement des choses en route.',
      'Pendant votre voyage, pensez à votre campement : un héros bien reposé est un héros qui tape fort.',
    ],
  },
  maree: {
    avant: [
      'Hmpf. Encore des aventuriers. Les derniers ont fini dans la soupe. Enfin, leurs chapeaux.',
      'Capitaine Bulle a pris l\'arène de la Coquille. Quand il gonfle, il devient dur comme un rocher.',
      'Les mouettes du coin sont des voleuses. Des vraies. Gardez vos poches fermées.',
      'L\'eau ne craint pas grand-chose… sauf la foudre et les plantes. Retenez ça, moussaillons.',
    ],
    apres: [
      'Bulle s\'est dégonflé ! Ça faisait des années que je rêvais de voir ça.',
      'Fort-Cramoisi est loin, de l\'autre côté de la Route des Cendres. Comptez une bonne demi-journée de marche.',
      'Là-bas, tout brûle. Prenez de quoi soigner les brûlures. Et un chapeau.',
    ],
  },
  enclume: {
    avant: [
      'Grmbl. Des visiteurs. Si c\'est pour réparer une épée, faut passer par la forge du campement.',
      'La Reine Magma garde l\'éclat dans l\'arène d\'Obsidienne. Quand elle se sent menacée, sa peau devient de la roche.',
      'De la roche, ça ne craint pas le feu. Mais l\'eau et les plantes, oui. À bon entendeur.',
      'Mes forges tournent grâce à la chaleur du volcan. C\'est pratique. Sauf l\'été.',
    ],
    apres: [
      'Elle est battue ?! Grmbl… bien joué. Vraiment.',
      'Le roi va être content. Mais d\'après mes cartes, il reste d\'autres éclats, bien plus loin…',
      'Revenez quand vous voulez. La suite de l\'aventure se prépare de l\'autre côté des montagnes.',
    ],
  },
}

// Ce qui peut arriver pendant un voyage (révélé à l'arrivée)
export const EVENEMENTS_VOYAGE = [
  { id: 'or', poids: 4, texte: 'Une bourse oubliée au bord du chemin. Personne ne la réclame.' },
  { id: 'potion', poids: 3, texte: 'Un colporteur endormi. Vous lui laissez un mot… et repartez avec des potions.' },
  { id: 'objet', poids: 3, texte: 'Un vieux coffre au pied d\'un arbre. Il n\'était même pas fermé.' },
  { id: 'xp', poids: 3, texte: 'L\'équipe s\'entraîne au bivouac. Pia gagne tous les concours de tir.' },
  { id: 'combat', poids: 2, texte: 'Une embuscade de monstres ! Vous les avez mis en fuite sans même ralentir.' },
]

export const FIN_V1 = [
  { pnj: 'roi', texte: 'Trois éclats ! Le sceptre recommence à briller… un tout petit peu.' },
  { pnj: 'roi', texte: 'Il en manque encore. On raconte qu\'ils sont au-delà des montagnes, dans des terres que même mes cartes ne connaissent pas.' },
  { pnj: 'roi', texte: 'Reposez-vous, héros. La suite de l\'aventure arrive bientôt. Et moi, je vais m\'acheter un tapis antidérapant.' },
]

// ── Bâtiments propres à chaque ville ────────────────────────
export const BATIMENTS_VILLE = {
  boulangerie: { nom: 'Boulangerie de Mère Miche', court: 'Boulangerie', image: 't-boulangerie', desc: 'Un bon repas renforce l\'équipe pour les 3 prochains combats.' },
  maitre: { nom: 'Maître d\'armes', court: 'Maître d\'armes', image: 't-maitre', desc: 'Apprenez de nouvelles capacités, différentes dans chaque ville.' },
  port: { nom: 'Le Quai des Expéditions', court: 'Expéditions', image: 't-port', desc: 'Envoyez un bateau en mer : il revient plus tard avec du butin.' },
  enchanteur: { nom: 'Atelier d\'enchantement', court: 'Enchanteur', image: 't-enchanteur', desc: 'Relancez les bonus d\'un objet pour tenter d\'obtenir mieux.' },
}

// Repas de la boulangerie : effet pendant 3 combats
export const REPAS = {
  brioche: { nom: 'Brioche dorée', icone: '🍞', desc: '+15 % de PV max', prix: 30, effet: { pv: 1.15 } },
  croissant: { nom: 'Croissant du guerrier', icone: '🥐', desc: '+12 % d\'attaque', prix: 35, effet: { atq: 1.12 } },
  chausson: { nom: 'Chausson enchanté', icone: '🥧', desc: '+12 % de magie', prix: 35, effet: { mag: 1.12 } },
  epices: { nom: 'Pain d\'épices', icone: '🍪', desc: '+20 % de vitesse et +5 % de critique', prix: 40, effet: { vit: 1.2, crit: 5 } },
}
export const DUREE_REPAS = 3

// Expéditions du port : durée en minutes, coût, butin
export const EXPEDITIONS = {
  cote: { nom: 'Pêche côtière', icone: '🎣', minutes: 30, cout: 20, desc: 'Or et potions.', butin: { or: [60, 110], potions: 2 } },
  crabes: { nom: 'L\'île aux crabes', icone: '🦀', minutes: 120, cout: 60, desc: 'Or et un objet rare ou mieux.', butin: { or: [150, 260], objet: 'rare', bonus: 20 } },
  epave: { nom: 'L\'épave engloutie', icone: '⚓', minutes: 360, cout: 150, desc: 'Beaucoup d\'or, un objet épique ou mieux et une plume de phénix.', butin: { or: [380, 600], objet: 'epique', plume: 1 } },
}
