# Royaume de Poche

RPG d'aventure solo, pensé pour le téléphone et joué dans le navigateur. Troisième jeu du studio Cosmoth.

En ligne : https://royaume-de-poche.vercel.app (mode test : https://royaume-de-poche.vercel.app/?vitesse=60)

Le roi Pépin a cassé le Sceptre des Saisons. Une équipe de trois héros (Bastien le guerrier, Lulu la mage, Pia la rôdeuse) parcourt le royaume pour récupérer les éclats, gardés par des champions d'arène.

## Ce qu'il y a dans la V1

- **Combats au tour par tour** façon Pokémon : 6 types (Neutre, Feu, Eau, Plante, Foudre, Roche) avec faiblesses et résistances, compétences apprises en montant de niveau, brûlure, étourdissement, provocation.
- **3 villes, 3 zones sauvages, 3 arènes** : 12 monstres et 3 champions avec une mécanique propre (le Roi Champignard lance une pluie de spores tous les 3 tours, Capitaine Bulle appelle un renfort à mi-vie, la Reine Magma devient de type Roche à mi-vie).
- **Loot façon Diablo** : 4 raretés (commun, rare, épique, légendaire), bonus tirés au hasard, une forge pour améliorer les objets.
- **Voyages chronométrés** façon Clash of Clans : 15 min puis 3 h entre les villes, avec un carnet de route révélé à l'arrivée.
- **Campement** : mine d'or, terrain d'entraînement et forge, avec un seul chantier à la fois.
- Boutique par ville (équipement renouvelé toutes les 4 h), auberge, personnages, bestiaire.

Pas de serveur ni de base de données : la partie est sauvegardée dans le navigateur (`localStorage`).

## Développer

```bash
npm install
npm run dev          # jeu en local
npm test             # tests du moteur
npm run simulation   # 30 parties jouées par une IA, pour vérifier l'équilibrage
```

**Mode test** : ajouter `?vitesse=60` à l'adresse fait passer le temps du jeu 60 fois plus vite (voyages, chantiers, production). `?vitesse=1` revient à la normale.

## Organisation

- `src/data/` : tout le contenu (héros, monstres, villes, objets, campement, dialogues). C'est là qu'on ajoute des monstres ou une ville.
- `src/engine/` : les règles, sans interface (combat, butin, progression, voyages). Testables avec Node.
- `src/ui/` : les écrans React.
- `art/manifest.txt` : liste des illustrations (nom + lien de génération). Une action GitHub les télécharge dans `art/src/`.
- `scripts/preparer-art.py` : détoure les personnages et convertit tout en WebP dans `public/art/`.

## Ajouter une illustration

1. Ajouter une ligne `nom lien` dans `art/manifest.txt` et pousser : l'action « Récupérer les illustrations » télécharge l'image dans `art/src/`.
2. `git pull`, puis `npm run art` pour générer le WebP dans `public/art/`.
