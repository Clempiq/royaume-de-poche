// Les trois héros de l'équipe, leurs statistiques et leurs capacités.
//
// Comme dans Pokémon, chaque héros connaît plusieurs capacités mais n'en
// emporte que 4 au combat (choisies dans l'écran Équipe). En plus, il a
// toujours son attaque de base, gratuite, dont le type suit celui de l'arme.
//
// Forme d'une capacité :
//  cout      : points de magie (PM) dépensés
//  cible     : 'ennemi' | 'ennemis' | 'allie' | 'allies' | 'soi'
//  type      : type élémentaire (voir types.js)
//  puissance : force de la capacité (100 = attaque de base)
//  stat      : 'atq' (physique) ou 'mag' (magique) ; la puissance de l'arme s'ajoute
//  coups     : nombre de frappes (défaut 1)
//  crit      : bonus de chance de coup critique
//  effets    : effets secondaires
//  niveau    : niveau où elle s'apprend toute seule
//  recharge  : nombre de tours avant de pouvoir la relancer
//  maitre    : ville du maître d'armes qui l'enseigne (au lieu d'un niveau), avec son prix

export const MAX_CAPACITES = 4

export const CLASSES = {
  guerrier: {
    nom: 'Guerrier',
    prenom: 'Bastien',
    image: 'hero-guerrier',
    role: 'Le tacticien : interrompt, provoque et ouvre la garde des ennemis',
    elements: ['neutre', 'roche'],
    arme: 'epee',
    base: { pv: 62, pm: 12, atq: 12, mag: 4, def: 12, vit: 8, crit: 5 },
    croissance: { pv: 14, pm: 1.6, atq: 2.6, mag: 0.6, def: 2.4, vit: 1.1 },
    attaque: { nom: 'Coup d\'épée', puissance: 100, stat: 'atq' },
    competences: [
      { niveau: 1, id: 'interruption', nom: 'Coup de bouclier', cout: 3, cible: 'ennemi', type: 'neutre', puissance: 70, stat: 'atq', recharge: 4, effets: [{ kind: 'interrompt' }], desc: 'Annule à coup sûr la prochaine action de la cible, même celle d\'un champion.' },
      { niveau: 1, id: 'brisegarde', nom: 'Brise-garde', cout: 3, cible: 'ennemi', type: 'neutre', puissance: 80, stat: 'atq', recharge: 2, effets: [{ kind: 'expose' }], desc: 'Expose la cible : la prochaine attaque d\'un allié sur elle fait +30 %.' },
      { niveau: 2, id: 'provoc', nom: 'Provocation', cout: 3, cible: 'soi', effets: [{ kind: 'provoc', tours: 2 }, { kind: 'buff', stat: 'def', mult: 1.5, tours: 2 }], desc: 'Toutes les attaques ciblées des ennemis le visent, et sa défense augmente (2 tours).' },
      { niveau: 4, id: 'tourbillon', nom: 'Tourbillon', cout: 5, cible: 'ennemis', type: 'neutre', puissance: 70, stat: 'atq', desc: 'Frappe tous les ennemis.' },
      { niveau: 6, id: 'seisme', nom: 'Frappe sismique', cout: 6, cible: 'ennemi', type: 'roche', puissance: 140, stat: 'atq', desc: 'Puissant coup de type Roche.' },
      { niveau: 9, id: 'rempart', nom: 'Rempart', cout: 7, cible: 'allies', effets: [{ kind: 'buff', stat: 'def', mult: 1.4, tours: 3 }], desc: 'Défense de toute l\'équipe renforcée (3 tours).' },
      { niveau: 12, id: 'eboulement', nom: 'Éboulement', cout: 8, cible: 'ennemis', type: 'roche', puissance: 85, stat: 'atq', desc: 'Des rochers sur tous les ennemis.' },
      { niveau: 14, id: 'charge', nom: 'Charge héroïque', cout: 9, cible: 'ennemi', type: 'neutre', puissance: 190, stat: 'atq', desc: 'Charge dévastatrice.' },
      { maitre: 'brioche', prix: 150, id: 'pommeau', nom: 'Coup de pommeau', cout: 3, cible: 'ennemi', type: 'roche', puissance: 105, stat: 'atq', desc: 'Petit coup de type Roche, bon marché.' },
      { maitre: 'gougere', prix: 380, id: 'riposte', nom: 'Posture de riposte', cout: 4, cible: 'soi', effets: [{ kind: 'riposte', tours: 2 }, { kind: 'buff', stat: 'def', mult: 1.3, tours: 2 }], desc: 'Pendant 2 tours, contre-attaque chaque ennemi qui le frappe.' },
      { maitre: 'cramoisi', prix: 650, id: 'avalanche', nom: 'Avalanche', cout: 10, cible: 'ennemis', type: 'roche', puissance: 115, stat: 'atq', desc: 'Énorme coup de type Roche sur tous les ennemis.' },
    ],
  },
  mage: {
    nom: 'Mage',
    prenom: 'Lulu',
    image: 'hero-mage',
    role: 'Maîtrise le feu et l\'eau, et soigne l\'équipe',
    elements: ['feu', 'eau'],
    arme: 'sceptre',
    base: { pv: 40, pm: 30, atq: 5, mag: 15, def: 6, vit: 10, crit: 5 },
    croissance: { pv: 8, pm: 4.2, atq: 0.8, mag: 3.2, def: 1.3, vit: 1.4 },
    attaque: { nom: 'Coup de bâton', puissance: 90, stat: 'mag' },
    competences: [
      { niveau: 1, id: 'feu', nom: 'Boule de feu', cout: 3, cible: 'ennemi', type: 'feu', puissance: 100, stat: 'mag', effets: [{ kind: 'brulure', chance: 0.25, tours: 3 }], desc: 'Peut brûler.' },
      { niveau: 1, id: 'soin', nom: 'Soin', cout: 4, cible: 'allie', effets: [{ kind: 'soin', puissance: 110 }], desc: 'Soigne un allié.' },
      { niveau: 2, id: 'eau', nom: 'Jet d\'eau', cout: 3, cible: 'ennemi', type: 'eau', puissance: 100, stat: 'mag', desc: 'Jet puissant de type Eau.' },
      { niveau: 4, id: 'vapeur', nom: 'Vapeur', cout: 5, cible: 'ennemis', type: 'eau', puissance: 70, stat: 'mag', desc: 'Nuage brûlant de type Eau sur tous les ennemis.' },
      { niveau: 6, id: 'arcane', nom: 'Bouclier arcanique', cout: 4, cible: 'allie', effets: [{ kind: 'buff', stat: 'def', mult: 1.6, tours: 3 }], desc: 'Un allié encaisse beaucoup mieux (3 tours).' },
      { niveau: 8, id: 'meteores', nom: 'Pluie de météores', cout: 9, cible: 'ennemis', type: 'feu', puissance: 100, stat: 'mag', effets: [{ kind: 'brulure', chance: 0.2, tours: 3 }], desc: 'Touche tous les ennemis, peut brûler.' },
      { niveau: 10, id: 'grandsoin', nom: 'Grand soin', cout: 10, cible: 'allies', effets: [{ kind: 'soin', puissance: 90 }], desc: 'Soigne toute l\'équipe.' },
      { niveau: 13, id: 'deluge', nom: 'Déluge', cout: 11, cible: 'ennemis', type: 'eau', puissance: 120, stat: 'mag', desc: 'Vague géante sur tous les ennemis.' },
      { maitre: 'brioche', prix: 200, id: 'meditation', nom: 'Méditation', cout: 0, cible: 'soi', effets: [{ kind: 'pm', valeur: 9 }], desc: 'Lulu se concentre et récupère 9 PM.' },
      { maitre: 'gougere', prix: 400, id: 'purification', nom: 'Purification', cout: 7, cible: 'allies', effets: [{ kind: 'soin', puissance: 55 }, { kind: 'purifie' }], desc: 'Soigne un peu toute l\'équipe et guérit les brûlures.' },
      { maitre: 'cramoisi', prix: 600, id: 'incandescence', nom: 'Incandescence', cout: 9, cible: 'ennemi', type: 'feu', puissance: 175, stat: 'mag', desc: 'Un trait de feu concentré, très puissant.' },
    ],
  },
  rodeur: {
    nom: 'Rôdeur',
    prenom: 'Pia',
    image: 'hero-rodeur',
    role: 'Rapide et précise, maîtrise la plante et la foudre',
    elements: ['plante', 'foudre'],
    arme: 'arc',
    base: { pv: 46, pm: 16, atq: 13, mag: 5, def: 8, vit: 15, crit: 12 },
    croissance: { pv: 10, pm: 2.2, atq: 2.9, mag: 0.8, def: 1.6, vit: 2.1 },
    attaque: { nom: 'Tir', puissance: 100, stat: 'atq' },
    competences: [
      { niveau: 1, id: 'precis', nom: 'Tir précis', cout: 2, cible: 'ennemi', type: 'neutre', puissance: 115, stat: 'atq', crit: 30, desc: 'Gros risque de coup critique.' },
      { niveau: 1, id: 'ronce', nom: 'Flèche de ronce', cout: 3, cible: 'ennemi', type: 'plante', puissance: 105, stat: 'atq', desc: 'Flèche de type Plante.' },
      { niveau: 3, id: 'foudroyante', nom: 'Flèche foudroyante', cout: 4, cible: 'ennemi', type: 'foudre', puissance: 110, stat: 'atq', desc: 'Flèche de type Foudre.' },
      { niveau: 5, id: 'pluie', nom: 'Pluie de flèches', cout: 5, cible: 'ennemis', type: 'neutre', puissance: 70, stat: 'atq', desc: 'Touche tous les ennemis.' },
      { niveau: 7, id: 'double', nom: 'Double tir', cout: 6, cible: 'ennemi', type: 'neutre', puissance: 80, stat: 'atq', coups: 2, crit: 15, desc: 'Deux flèches d\'affilée.' },
      { niveau: 9, id: 'lianes', nom: 'Filet de lianes', cout: 6, cible: 'ennemis', type: 'plante', puissance: 65, stat: 'atq', desc: 'Des lianes sur tous les ennemis.' },
      { niveau: 11, id: 'orage', nom: 'Pluie d\'orage', cout: 8, cible: 'ennemis', type: 'foudre', puissance: 85, stat: 'atq', desc: 'Des éclairs sur tous les ennemis.' },
      { niveau: 14, id: 'sylvestre', nom: 'Tir sylvestre', cout: 8, cible: 'ennemi', type: 'plante', puissance: 165, stat: 'atq', desc: 'Flèche géante de type Plante.' },
      { maitre: 'brioche', prix: 180, id: 'paralysant', nom: 'Tir paralysant', cout: 4, cible: 'ennemi', type: 'neutre', puissance: 70, stat: 'atq', effets: [{ kind: 'etourdi', chance: 0.45 }], desc: 'Grande chance d\'étourdir (moins sur un champion).' },
      { maitre: 'gougere', prix: 360, id: 'marque', nom: 'Marque du chasseur', cout: 3, cible: 'ennemi', type: 'foudre', puissance: 60, stat: 'atq', recharge: 2, effets: [{ kind: 'expose' }], desc: 'Expose la cible : la prochaine attaque d\'un allié sur elle fait +30 %.' },
      { maitre: 'cramoisi', prix: 600, id: 'tempete', nom: 'Flèche tempête', cout: 9, cible: 'ennemi', type: 'foudre', puissance: 170, stat: 'atq', desc: 'Flèche chargée d\'orage, très puissante.' },
    ],
  },
}

export const ORDRE_EQUIPE = ['guerrier', 'mage', 'rodeur']
export const NIVEAU_MAX = 20

// XP nécessaire pour passer du niveau n au niveau n+1
export function xpPourNiveau(n) {
  return Math.round(18 * Math.pow(n, 1.55) + 10)
}

export const capaciteParId = (classe, id) => CLASSES[classe].competences.find((c) => c.id === id)
