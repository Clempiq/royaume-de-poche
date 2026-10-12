// Le campement : des bâtiments qu'on améliore avec de l'or et du temps.
// Un seul chantier à la fois, comme un ouvrier dans Clash of Clans.
// Index des tableaux = niveau (le niveau 0 n'existe pas).

export const BATIMENTS = {
  mine: {
    nom: 'Mine d\'or',
    icone: '⛏️',
    desc: 'Produit de l\'or en continu, même quand vous n\'êtes pas là. Pensez à récolter avant qu\'elle soit pleine.',
    production: [0, 20, 40, 70, 110, 160], // or par heure
    capacite: [0, 80, 200, 400, 650, 1000],
    cout: [0, 0, 90, 260, 650, 1300],
    duree: [0, 0, 2, 20, 90, 240], // minutes
  },
  entrainement: {
    nom: 'Terrain d\'entraînement',
    icone: '🎯',
    desc: 'Vos héros gagnent de l\'expérience pendant que vous faites autre chose.',
    production: [0, 12, 25, 45, 75, 115], // XP par heure et par héros
    capacite: [0, 60, 160, 330, 560, 900],
    cout: [0, 0, 110, 320, 750, 1500],
    duree: [0, 0, 3, 25, 100, 260],
  },
  forge: {
    nom: 'Forge',
    icone: '🔨',
    desc: 'Améliore votre équipement. Chaque niveau de forge permet d\'aller un cran plus loin (+1, +2…).',
    cout: [0, 0, 130, 380, 850, 1700],
    duree: [0, 0, 3, 25, 100, 260],
  },
}

export const NIVEAU_MAX_BATIMENT = 5
