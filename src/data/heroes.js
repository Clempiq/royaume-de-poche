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
//  maitre    : ville du maître d'armes qui l'enseigne (au lieu d'un niveau), avec son prix

export const MAX_CAPACITES = 4

export const CLASSES = {
  guerrier: {
    nom: 'Guerrier',
    prenom: 'Bastien',
    image: 'hero-guerrier',
    role: 'Encaisse les coups et protège l\'équipe',
    arme: 'epee',
    base: { pv: 62, pm: 12, atq: 12, mag: 4, def: 12, vit: 8, crit: 5 },
    croissance: { pv: 14, pm: 1.6, atq: 2.6, mag: 0.6, def: 2.4, vit: 1.1 },
    attaque: { nom: 'Coup d\'épée', puissance: 100, stat: 'atq' },
    competences: [
      { niveau: 1, id: 'bouclier', nom: 'Coup de bouclier', cout: 3, cible: 'ennemi', type: 'neutre', puissance: 85, stat: 'atq', effets: [{ kind: 'etourdi', chance: 0.3 }], desc: 'Peut étourdir : la cible perd son prochain tour.' },
      { niveau: 2, id: 'provoc', nom: 'Provocation', cout: 3, cible: 'soi', effets: [{ kind: 'provoc', tours: 2 }, { kind: 'buff', stat: 'def', mult: 1.5, tours: 2 }], desc: 'Attire les attaques et renforce sa défense (2 tours).' },
      { niveau: 4, id: 'tourbillon', nom: 'Tourbillon', cout: 5, cible: 'ennemis', type: 'neutre', puissance: 70, stat: 'atq', desc: 'Frappe tous les ennemis.' },
      { niveau: 7, id: 'seisme', nom: 'Frappe sismique', cout: 6, cible: 'ennemi', type: 'roche', puissance: 145, stat: 'atq', desc: 'Puissant coup de type Roche.' },
      { niveau: 10, id: 'rempart', nom: 'Rempart', cout: 7, cible: 'allies', effets: [{ kind: 'buff', stat: 'def', mult: 1.4, tours: 3 }], desc: 'Défense de toute l\'équipe renforcée (3 tours).' },
      { niveau: 13, id: 'charge', nom: 'Charge héroïque', cout: 9, cible: 'ennemi', type: 'neutre', puissance: 200, stat: 'atq', effets: [{ kind: 'etourdi', chance: 0.25 }], desc: 'Charge dévastatrice qui peut étourdir.' },
      { maitre: 'brioche', prix: 150, id: 'lierre', nom: 'Lame de lierre', cout: 4, cible: 'ennemi', type: 'plante', puissance: 120, stat: 'atq', desc: 'Coup d\'épée de type Plante.' },
      { maitre: 'gougere', prix: 380, id: 'maree', nom: 'Taillade des marées', cout: 5, cible: 'ennemi', type: 'eau', puissance: 130, stat: 'atq', desc: 'Coup d\'épée de type Eau.' },
      { maitre: 'gougere', prix: 420, id: 'tonnerre', nom: 'Coup de tonnerre', cout: 5, cible: 'ennemi', type: 'foudre', puissance: 120, stat: 'atq', effets: [{ kind: 'etourdi', chance: 0.15 }], desc: 'Coup de type Foudre qui peut étourdir.' },
      { maitre: 'cramoisi', prix: 650, id: 'ardente', nom: 'Lame ardente', cout: 6, cible: 'ennemi', type: 'feu', puissance: 140, stat: 'atq', effets: [{ kind: 'brulure', chance: 0.3, tours: 3 }], desc: 'Coup de type Feu qui peut brûler.' },
    ],
  },
  mage: {
    nom: 'Mage',
    prenom: 'Lulu',
    image: 'hero-mage',
    role: 'Maîtrise les éléments et soigne',
    arme: 'sceptre',
    base: { pv: 40, pm: 30, atq: 5, mag: 15, def: 6, vit: 10, crit: 5 },
    croissance: { pv: 8, pm: 4.2, atq: 0.8, mag: 3.2, def: 1.3, vit: 1.4 },
    attaque: { nom: 'Coup de bâton', puissance: 90, stat: 'mag' },
    competences: [
      { niveau: 1, id: 'feu', nom: 'Boule de feu', cout: 3, cible: 'ennemi', type: 'feu', puissance: 100, stat: 'mag', effets: [{ kind: 'brulure', chance: 0.25, tours: 3 }], desc: 'Peut brûler.' },
      { niveau: 1, id: 'soin', nom: 'Soin', cout: 4, cible: 'allie', effets: [{ kind: 'soin', puissance: 110 }], desc: 'Soigne un allié.' },
      { niveau: 2, id: 'eau', nom: 'Jet d\'eau', cout: 3, cible: 'ennemi', type: 'eau', puissance: 100, stat: 'mag', desc: 'Jet puissant de type Eau.' },
      { niveau: 4, id: 'eclair', nom: 'Éclair', cout: 4, cible: 'ennemi', type: 'foudre', puissance: 110, stat: 'mag', effets: [{ kind: 'etourdi', chance: 0.15 }], desc: 'Peut étourdir.' },
      { niveau: 6, id: 'ronces', nom: 'Ronces', cout: 5, cible: 'ennemis', type: 'plante', puissance: 75, stat: 'mag', desc: 'Touche tous les ennemis.' },
      { niveau: 9, id: 'meteores', nom: 'Pluie de météores', cout: 9, cible: 'ennemis', type: 'feu', puissance: 105, stat: 'mag', effets: [{ kind: 'brulure', chance: 0.2, tours: 3 }], desc: 'Touche tous les ennemis, peut brûler.' },
      { niveau: 12, id: 'grandsoin', nom: 'Grand soin', cout: 10, cible: 'allies', effets: [{ kind: 'soin', puissance: 90 }], desc: 'Soigne toute l\'équipe.' },
      { niveau: 15, id: 'deluge', nom: 'Déluge', cout: 11, cible: 'ennemis', type: 'eau', puissance: 125, stat: 'mag', desc: 'Vague géante sur tous les ennemis.' },
      { maitre: 'brioche', prix: 200, id: 'arcane', nom: 'Bouclier arcanique', cout: 4, cible: 'allie', effets: [{ kind: 'buff', stat: 'def', mult: 1.6, tours: 3 }], desc: 'Un allié encaisse beaucoup mieux (3 tours).' },
      { maitre: 'gougere', prix: 400, id: 'cage', nom: 'Cage de foudre', cout: 6, cible: 'ennemis', type: 'foudre', puissance: 75, stat: 'mag', effets: [{ kind: 'etourdi', chance: 0.12 }], desc: 'Touche tous les ennemis, peut étourdir.' },
      { maitre: 'cramoisi', prix: 600, id: 'rochers', nom: 'Pluie de rochers', cout: 7, cible: 'ennemis', type: 'roche', puissance: 85, stat: 'mag', desc: 'Touche tous les ennemis, type Roche.' },
    ],
  },
  rodeur: {
    nom: 'Rôdeur',
    prenom: 'Pia',
    image: 'hero-rodeur',
    role: 'Rapide et précise, multiplie les coups critiques',
    arme: 'arc',
    base: { pv: 46, pm: 16, atq: 13, mag: 5, def: 8, vit: 15, crit: 12 },
    croissance: { pv: 10, pm: 2.2, atq: 2.9, mag: 0.8, def: 1.6, vit: 2.1 },
    attaque: { nom: 'Tir', puissance: 100, stat: 'atq' },
    competences: [
      { niveau: 1, id: 'precis', nom: 'Tir précis', cout: 2, cible: 'ennemi', type: 'neutre', puissance: 115, stat: 'atq', crit: 30, desc: 'Gros risque de coup critique.' },
      { niveau: 3, id: 'ronce', nom: 'Flèche de ronce', cout: 3, cible: 'ennemi', type: 'plante', puissance: 105, stat: 'atq', desc: 'Flèche de type Plante.' },
      { niveau: 5, id: 'pluie', nom: 'Pluie de flèches', cout: 5, cible: 'ennemis', type: 'neutre', puissance: 70, stat: 'atq', desc: 'Touche tous les ennemis.' },
      { niveau: 7, id: 'foudroyante', nom: 'Flèche foudroyante', cout: 5, cible: 'ennemi', type: 'foudre', puissance: 130, stat: 'atq', desc: 'Flèche de type Foudre.' },
      { niveau: 10, id: 'double', nom: 'Double tir', cout: 6, cible: 'ennemi', type: 'neutre', puissance: 80, stat: 'atq', coups: 2, crit: 15, desc: 'Deux flèches d\'affilée.' },
      { niveau: 13, id: 'aquatique', nom: 'Flèche des marées', cout: 6, cible: 'ennemi', type: 'eau', puissance: 140, stat: 'atq', desc: 'Flèche de type Eau.' },
      { maitre: 'brioche', prix: 180, id: 'paralysant', nom: 'Tir paralysant', cout: 4, cible: 'ennemi', type: 'neutre', puissance: 70, stat: 'atq', effets: [{ kind: 'etourdi', chance: 0.45 }], desc: 'Grande chance d\'étourdir.' },
      { maitre: 'gougere', prix: 360, id: 'harpon', nom: 'Flèche-harpon', cout: 4, cible: 'ennemi', type: 'eau', puissance: 115, stat: 'atq', desc: 'Flèche de type Eau.' },
      { maitre: 'cramoisi', prix: 600, id: 'incendiaire', nom: 'Flèche incendiaire', cout: 5, cible: 'ennemi', type: 'feu', puissance: 120, stat: 'atq', effets: [{ kind: 'brulure', chance: 0.4, tours: 3 }], desc: 'Grande chance de brûler.' },
      { maitre: 'cramoisi', prix: 650, id: 'percecroc', nom: 'Flèche perce-roc', cout: 5, cible: 'ennemi', type: 'roche', puissance: 125, stat: 'atq', desc: 'Flèche de type Roche.' },
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
