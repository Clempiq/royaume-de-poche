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
    // Le parcours de la zone : 6 cases, la dernière est le champion
    parcours: [
      { t: 'combat', ennemis: [['grignaud', 1], ['champi', 1]] },
      { t: 'combat', ennemis: [['gloupi', 2], ['bzzou', 2]] },
      { t: 'feu' },
      { t: 'combat', ennemis: [['champi', 3], ['grignaud', 3], ['gloupi', 2]] },
      { t: 'elite', ennemis: [['bzzou', 5, true], ['champi', 3]] },
      { t: 'champion' },
    ],
    arene: { nom: 'Arène des Sporelles', boss: 'champignard', niveau: 5, conseil: 5 },
    pnj: 'miche',
    batiments: ['maitre'],
    boutique: ['potion', 'ether', 'plume'],
    suivante: 'gougere',
  },
  gougere: {
    nom: 'Port-Gougère',
    image: 'v-gougere',
    accroche: 'Un port de pêche où même les mouettes ont un casier judiciaire.',
    zone: {
      nom: 'Falaises Salées', image: 'z-falaises', niveaux: [6, 8],
      monstres: [['crabouille', 3], ['grognard', 2], ['goeland', 3], ['meduzz', 2]],
      groupe: [[1, 2], [2, 4], [3, 2]],
    },
    parcours: [
      { t: 'combat', ennemis: [['crabouille', 6], ['goeland', 6]] },
      { t: 'combat', ennemis: [['meduzz', 6], ['grognard', 7]] },
      { t: 'feu' },
      { t: 'combat', ennemis: [['goeland', 7], ['meduzz', 7], ['crabouille', 7]] },
      { t: 'elite', ennemis: [['grognard', 8, true], ['meduzz', 7]] },
      { t: 'champion' },
    ],
    arene: { nom: 'Arène de la Coquille', boss: 'bulle', niveau: 10, conseil: 9 },
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
      nom: 'Pentes Fumantes', image: 'z-pentes', niveaux: [11, 13],
      monstres: [['braisillon', 3], ['rocaille', 2], ['fumeron', 2], ['ronceloup', 3]],
      groupe: [[1, 1], [2, 4], [3, 3]],
    },
    parcours: [
      { t: 'combat', ennemis: [['braisillon', 11], ['ronceloup', 11]] },
      { t: 'combat', ennemis: [['rocaille', 11], ['fumeron', 12]] },
      { t: 'feu' },
      { t: 'combat', ennemis: [['ronceloup', 12], ['braisillon', 12], ['rocaille', 12]] },
      { t: 'elite', ennemis: [['rocaille', 13, true], ['braisillon', 12]] },
      { t: 'champion' },
    ],
    arene: { nom: 'Arène d\'Obsidienne', boss: 'magma', niveau: 15, conseil: 14 },
    pnj: 'enclume',
    batiments: ['maitre'],
    boutique: ['superpotion', 'ether', 'superether', 'plume', 'antibrulure'],
    suivante: null,
  },
}

export const ORDRE_VILLES = ['brioche', 'gougere', 'cramoisi']

// Les routes entre les villes : un parcours à traverser, comme une zone.
// On arrive dès qu'on l'a terminé, sans attente.
export const VOYAGES = {
  'brioche>gougere': {
    nom: 'Chemin des Haies',
    image: 'z-pres',
    parcours: [
      { t: 'combat', ennemis: [['grignaud', 4], ['bzzou', 4]] },
      { t: 'combat', ennemis: [['crabouille', 4], ['champi', 4]] },
      { t: 'feu' },
      { t: 'combat', ennemis: [['goeland', 5], ['gloupi', 5], ['bzzou', 4]] },
      { t: 'elite', ennemis: [['crabouille', 5, true], ['goeland', 4]] },
      { t: 'arrivee' },
    ],
  },
  'gougere>cramoisi': {
    nom: 'Route des Cendres',
    image: 'z-pentes',
    parcours: [
      { t: 'combat', ennemis: [['grognard', 9], ['braisillon', 9]] },
      { t: 'combat', ennemis: [['meduzz', 9], ['fumeron', 9]] },
      { t: 'feu' },
      { t: 'combat', ennemis: [['ronceloup', 10], ['goeland', 10], ['braisillon', 9]] },
      { t: 'elite', ennemis: [['ronceloup', 10, true], ['fumeron', 9]] },
      { t: 'arrivee' },
    ],
  },
}

// Soin d'un feu de camp : part des PV et PM maximum rendue
export const SOIN_FEU = 0.5

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
      'Le Roi Champignard s\'est installé dans l\'arène, au bout des Prés Moelleux. Il exige une brioche par jour. Une brioche ! Par jour !',
      'Un conseil de boulangère : les champignons détestent le feu. Votre petite mage devrait s\'en souvenir.',
      'Si vous êtes fatigués, l\'auberge est gratuite pour les héros, et le repas aussi. Je suis maire, c\'est moi qui décide.',
    ],
    apres: [
      'Vous l\'avez battu ! Ce soir, brioches gratuites pour tout le monde. Sauf pour lui.',
      'La route vers Port-Gougère passe par le Chemin des Haies. Les monstres du coin y traînent, gardez des potions sous la main.',
      'Pensez à votre village : une bonne caserne et de solides remparts, et vos héros tapent plus fort.',
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
      'Fort-Cramoisi est loin, de l\'autre côté de la Route des Cendres. La route grouille de bestioles brûlantes : prévoyez de quoi soigner.',
      'Là-bas, tout brûle. Prenez de quoi soigner les brûlures. Et un chapeau.',
    ],
  },
  enclume: {
    avant: [
      'Grmbl. Des visiteurs. Si c\'est pour réparer une épée, faut passer par l\'atelier de votre village.',
      'La Reine Magma garde l\'éclat dans l\'arène d\'Obsidienne. Quand elle se sent menacée, sa peau devient de la roche.',
      'De la roche, ça ne craint pas le feu. Mais l\'eau et les plantes, oui. À bon entendeur.',
      'Mes forges tournent grâce à la chaleur du volcan. C\'est pratique. Sauf l\'été.',
    ],
    apres: [
      'Elle est battue ?! Grmbl… bien joué. Vraiment.',
      'Le troisième éclat ! Le sceptre va enfin pouvoir être recollé.',
      'Allez, filez chez le roi. Et dites-lui de regarder où il met les pieds.',
    ],
  },
}

export const FIN = [
  { pnj: 'roi', texte: 'Trois éclats ! Donnez, donnez… un peu de colle, on presse fort… et voilà !' },
  { pnj: 'roi', texte: 'Le Sceptre des Saisons brille comme au premier jour. Le printemps revient sur les Prés Moelleux, la mer se calme à Port-Gougère, le volcan fait la sieste.' },
  { pnj: 'miche', texte: 'Brioches gratuites pour tout le royaume ! Bon, pour une semaine. Je suis maire, pas magicienne.' },
  { pnj: 'roi', texte: 'Héros, le Royaume de Poche vous doit tout. J\'ai fait poser un tapis antidérapant dans la salle du trône. Plus jamais ça.' },
  { pnj: 'enclume', texte: 'Grmbl. Les champions, eux, ne sont pas partis. Ils s\'entraînent dans leurs arènes et veulent leur revanche, tous les jours.' },
  { pnj: 'roi', texte: 'Alors relevez le Défi du jour ! Un champion, une règle nouvelle chaque jour, et votre meilleur score gravé dans le marbre. Enfin, dans le navigateur.' },
]

// ── Bâtiments propres à chaque ville ────────────────────────
export const BATIMENTS_VILLE = {
  maitre: { nom: 'Maître d\'armes', court: 'Maître d\'armes', image: 't-maitre', desc: 'Des capacités différentes dans chaque ville. Jamais indispensables, toujours utiles.' },
  port: { nom: 'Le Quai des Expéditions', court: 'Expéditions', image: 't-port', desc: 'Envoyez un bateau en mer : il revient plus tard avec du butin.' },
}

// Repas de l'auberge : gratuit, au choix, effet pendant 3 combats
export const REPAS = {
  brioche: { nom: 'Brioche dorée', icone: '🍞', desc: '+15 % de PV max', effet: { pv: 1.15 } },
  croissant: { nom: 'Croissant du guerrier', icone: '🥐', desc: '+12 % d\'attaque', effet: { atq: 1.12 } },
  chausson: { nom: 'Chausson enchanté', icone: '🥧', desc: '+12 % de magie', effet: { mag: 1.12 } },
  epices: { nom: 'Pain d\'épices', icone: '🍪', desc: '+20 % de vitesse et +5 % de critique', effet: { vit: 1.2, crit: 5 } },
}
export const DUREE_REPAS = 3

// Expéditions du port : durée en minutes, coût, butin
export const EXPEDITIONS = {
  cote: { nom: 'Pêche côtière', icone: '🎣', minutes: 30, cout: 20, desc: 'Or et potions.', butin: { or: [60, 110], potions: 2 } },
  crabes: { nom: 'L\'île aux crabes', icone: '🦀', minutes: 120, cout: 60, desc: 'Or et un objet rare ou mieux.', butin: { or: [150, 260], objet: 'rare', bonus: 20 } },
  epave: { nom: 'L\'épave engloutie', icone: '⚓', minutes: 360, cout: 150, desc: 'Beaucoup d\'or, un objet épique ou mieux et une plume de phénix.', butin: { or: [380, 600], objet: 'epique', plume: 1 } },
}

// ── Défi du jour ────────────────────────────────────────────
// Un champion déjà battu, une règle tirée de la date, un record local.
export const REGLES_DEFI = {
  sansObjets: { nom: 'Sac vide', icone: '🎒', desc: 'Aucun objet utilisable pendant le combat.' },
  renfort: { nom: 'Garde rapprochée', icone: '🛡️', desc: 'Le champion arrive avec un monstre de sa zone.' },
  pmMoitie: { nom: 'Nuit blanche', icone: '🥱', desc: 'Les héros commencent avec la moitié de leurs PM.' },
  chargeRapide: { nom: 'Champion enragé', icone: '😡', desc: 'Le champion prépare sa grosse attaque tous les 2 tours.' },
}
export const NIVEAU_BONUS_DEFI = 1
