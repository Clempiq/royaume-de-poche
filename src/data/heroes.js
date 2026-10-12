// Les trois héros de l'équipe, leurs statistiques et les compétences
// qu'ils apprennent en montant de niveau.
//
// Forme d'une compétence :
//  cout      : points de magie (PM) dépensés
//  cible     : 'ennemi' | 'ennemis' | 'allie' | 'allies' | 'soi'
//  type      : type élémentaire de l'attaque (voir types.js)
//  puissance : force de l'attaque (100 = attaque de base)
//  stat      : 'atq' (physique) ou 'mag' (magique)
//  coups     : nombre de frappes (défaut 1)
//  crit      : bonus de chance de coup critique
//  effets    : liste d'effets secondaires

export const CLASSES = {
  guerrier: {
    nom: 'Guerrier',
    prenom: 'Bastien',
    image: 'hero-guerrier',
    role: 'Encaisse les coups et protège l\'équipe',
    arme: 'epee',
    base: { pv: 62, pm: 12, atq: 12, mag: 4, def: 12, vit: 8, crit: 5 },
    croissance: { pv: 14, pm: 1.6, atq: 2.6, mag: 0.6, def: 2.4, vit: 1.1 },
    attaque: { nom: 'Coup d\'épée', type: 'neutre', puissance: 100, stat: 'atq' },
    competences: [
      { niveau: 1, id: 'bouclier', nom: 'Coup de bouclier', cout: 3, cible: 'ennemi', type: 'neutre', puissance: 85, stat: 'atq', effets: [{ kind: 'etourdi', chance: 0.3 }], desc: 'Frappe avec le bouclier. Peut étourdir.' },
      { niveau: 3, id: 'provoc', nom: 'Provocation', cout: 4, cible: 'soi', effets: [{ kind: 'provoc', tours: 2 }, { kind: 'buff', stat: 'def', mult: 1.5, tours: 2 }], desc: 'Attire les attaques ennemies et renforce sa défense pendant 2 tours.' },
      { niveau: 5, id: 'tourbillon', nom: 'Tourbillon', cout: 6, cible: 'ennemis', type: 'neutre', puissance: 70, stat: 'atq', desc: 'Frappe tous les ennemis.' },
      { niveau: 8, id: 'seisme', nom: 'Frappe sismique', cout: 7, cible: 'ennemi', type: 'roche', puissance: 150, stat: 'atq', desc: 'Puissant coup de type Roche.' },
      { niveau: 11, id: 'rempart', nom: 'Rempart', cout: 8, cible: 'allies', effets: [{ kind: 'buff', stat: 'def', mult: 1.4, tours: 3 }], desc: 'Renforce la défense de toute l\'équipe pendant 3 tours.' },
      { niveau: 14, id: 'charge', nom: 'Charge héroïque', cout: 10, cible: 'ennemi', type: 'neutre', puissance: 210, stat: 'atq', effets: [{ kind: 'etourdi', chance: 0.25 }], desc: 'Charge dévastatrice qui peut étourdir.' },
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
    attaque: { nom: 'Coup de bâton', type: 'neutre', puissance: 100, stat: 'atq' },
    competences: [
      { niveau: 1, id: 'feu', nom: 'Boule de feu', cout: 3, cible: 'ennemi', type: 'feu', puissance: 100, stat: 'mag', effets: [{ kind: 'brulure', chance: 0.25, tours: 3 }], desc: 'Projectile de Feu. Peut brûler.' },
      { niveau: 1, id: 'soin', nom: 'Soin', cout: 4, cible: 'allie', effets: [{ kind: 'soin', puissance: 110 }], desc: 'Soigne un allié.' },
      { niveau: 2, id: 'eau', nom: 'Jet d\'eau', cout: 3, cible: 'ennemi', type: 'eau', puissance: 100, stat: 'mag', desc: 'Puissant jet de type Eau.' },
      { niveau: 4, id: 'eclair', nom: 'Éclair', cout: 4, cible: 'ennemi', type: 'foudre', puissance: 110, stat: 'mag', effets: [{ kind: 'etourdi', chance: 0.15 }], desc: 'Éclair de Foudre. Peut étourdir.' },
      { niveau: 6, id: 'ronces', nom: 'Ronces', cout: 5, cible: 'ennemis', type: 'plante', puissance: 75, stat: 'mag', desc: 'Des ronces jaillissent sous tous les ennemis.' },
      { niveau: 9, id: 'meteores', nom: 'Pluie de météores', cout: 10, cible: 'ennemis', type: 'feu', puissance: 105, stat: 'mag', effets: [{ kind: 'brulure', chance: 0.2, tours: 3 }], desc: 'Des météores s\'abattent sur tous les ennemis.' },
      { niveau: 12, id: 'grandsoin', nom: 'Grand soin', cout: 11, cible: 'allies', effets: [{ kind: 'soin', puissance: 90 }], desc: 'Soigne toute l\'équipe.' },
      { niveau: 15, id: 'deluge', nom: 'Déluge', cout: 12, cible: 'ennemis', type: 'eau', puissance: 125, stat: 'mag', desc: 'Une vague géante frappe tous les ennemis.' },
    ],
  },
  rodeur: {
    nom: 'Rôdeur',
    prenom: 'Pia',
    image: 'hero-rodeur',
    role: 'Rapide et précis, multiplie les coups critiques',
    arme: 'arc',
    base: { pv: 46, pm: 16, atq: 13, mag: 5, def: 8, vit: 15, crit: 12 },
    croissance: { pv: 10, pm: 2.2, atq: 2.9, mag: 0.8, def: 1.6, vit: 2.1 },
    attaque: { nom: 'Tir', type: 'neutre', puissance: 100, stat: 'atq' },
    competences: [
      { niveau: 1, id: 'precis', nom: 'Tir précis', cout: 2, cible: 'ennemi', type: 'neutre', puissance: 115, stat: 'atq', crit: 30, desc: 'Vise un point faible : gros risque de critique.' },
      { niveau: 3, id: 'ronce', nom: 'Flèche de ronce', cout: 3, cible: 'ennemi', type: 'plante', puissance: 105, stat: 'atq', desc: 'Flèche de type Plante.' },
      { niveau: 5, id: 'pluie', nom: 'Pluie de flèches', cout: 5, cible: 'ennemis', type: 'neutre', puissance: 70, stat: 'atq', desc: 'Touche tous les ennemis.' },
      { niveau: 7, id: 'foudroyante', nom: 'Flèche foudroyante', cout: 5, cible: 'ennemi', type: 'foudre', puissance: 130, stat: 'atq', desc: 'Flèche chargée de Foudre.' },
      { niveau: 10, id: 'double', nom: 'Double tir', cout: 6, cible: 'ennemi', type: 'neutre', puissance: 80, stat: 'atq', coups: 2, crit: 15, desc: 'Deux flèches d\'affilée.' },
      { niveau: 13, id: 'aquatique', nom: 'Flèche des marées', cout: 6, cible: 'ennemi', type: 'eau', puissance: 140, stat: 'atq', desc: 'Flèche de type Eau.' },
    ],
  },
}

export const ORDRE_EQUIPE = ['guerrier', 'mage', 'rodeur']
export const NIVEAU_MAX = 20

// XP nécessaire pour passer du niveau n au niveau n+1
export function xpPourNiveau(n) {
  return Math.round(18 * Math.pow(n, 1.55) + 10)
}
