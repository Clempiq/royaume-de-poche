// Le village des héros, façon Clash of Clans : des bâtiments qu'on
// construit puis qu'on améliore avec de l'or et du temps.
// Le Château est le bâtiment principal : aucun autre bâtiment ne peut
// dépasser son niveau, et chaque niveau de château débloque de nouvelles
// constructions. Un ouvrier mène un chantier à la fois ; la Hutte du
// bâtisseur en ajoute un second.
//
// Index des tableaux = niveau visé (0 = pas encore construit).
// deblocage : niveau de château nécessaire pour construire le bâtiment.

export const BATIMENTS = {
  chateau: {
    nom: 'Château',
    icone: '🏰',
    image: 't-chateau',
    desc: 'Le cœur du village. Son niveau limite celui des autres bâtiments et débloque de nouvelles constructions.',
    max: 5,
    cout: [0, 0, 300, 900, 2000, 4000],
    duree: [0, 0, 5, 30, 120, 360], // minutes
  },
  mine: {
    nom: 'Mine d\'or',
    icone: '⛏️',
    image: 't-mine',
    desc: 'Produit de l\'or en continu, même quand vous n\'êtes pas là. Pensez à récolter avant qu\'elle soit pleine.',
    max: 5,
    deblocage: 1,
    production: [0, 20, 40, 70, 110, 160], // or par heure
    capacite: [0, 80, 200, 400, 650, 1000],
    cout: [0, 0, 90, 260, 650, 1300],
    duree: [0, 0, 2, 20, 90, 240],
  },
  herboristerie: {
    nom: 'Herboristerie',
    icone: '🌿',
    image: 't-herboristerie',
    desc: 'Prépare des potions toute seule. À partir du niveau 3, une sur deux est une super potion.',
    max: 5,
    deblocage: 1,
    production: [0, 1, 1.6, 2.4, 3.2, 4.5], // potions par heure
    capacite: [0, 4, 7, 10, 14, 20],
    cout: [0, 0, 120, 340, 780, 1500],
    duree: [0, 0, 3, 25, 100, 260],
  },
  forge: {
    nom: 'Atelier',
    icone: '🔨',
    image: 't-forge',
    desc: 'Améliore votre équipement (chaque niveau permet d\'aller un cran plus loin : +1, +2…) et relance les bonus des objets.',
    max: 5,
    deblocage: 1,
    cout: [0, 0, 130, 380, 850, 1700],
    duree: [0, 0, 3, 25, 100, 260],
  },
  caserne: {
    nom: 'Caserne',
    icone: '⚔️',
    image: 't-caserne',
    desc: 'Les héros s\'y entraînent au maniement des armes et des sorts.',
    max: 5,
    deblocage: 2,
    bonus: { atq: 0.04, mag: 0.04 }, // par niveau
    cout: [0, 200, 450, 900, 1600, 2600],
    duree: [0, 2, 10, 40, 120, 300],
  },
  remparts: {
    nom: 'Remparts',
    icone: '🛡️',
    image: 't-remparts',
    desc: 'Un village bien défendu, des héros qui dorment tranquilles et encaissent mieux.',
    max: 5,
    deblocage: 2,
    bonus: { pv: 0.04, def: 0.04 },
    cout: [0, 200, 450, 900, 1600, 2600],
    duree: [0, 2, 10, 40, 120, 300],
  },
  bibliotheque: {
    nom: 'Bibliothèque',
    icone: '📚',
    image: 't-bibliotheque',
    desc: 'Les héros y étudient : plus de PM, et au niveau 3, une 5e capacité emportée au combat.',
    max: 3,
    deblocage: 3,
    bonus: { pm: 3 }, // PM en plus par niveau
    cout: [0, 400, 1000, 2000],
    duree: [0, 10, 60, 180],
  },
  hutte: {
    nom: 'Hutte du bâtisseur',
    icone: '🔧',
    image: 't-hutte',
    desc: 'Un second ouvrier : deux chantiers peuvent avancer en même temps.',
    max: 1,
    deblocage: 3,
    cout: [0, 1500],
    duree: [0, 30],
  },
}

// Ordre d'affichage sur la carte du village
export const ORDRE_BATIMENTS = ['chateau', 'mine', 'herboristerie', 'forge', 'caserne', 'remparts', 'bibliotheque', 'hutte']

export const NIVEAU_MAX_BATIMENT = 5
export const NIVEAU_BIBLIOTHEQUE_5E_CAPACITE = 3
