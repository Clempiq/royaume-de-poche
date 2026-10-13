# Royaume de Poche

RPG d'aventure solo, pensé pour le téléphone et joué dans le navigateur. Troisième jeu du studio Cosmoth.

En ligne : https://royaume-de-poche.vercel.app (mode test : https://royaume-de-poche.vercel.app/?vitesse=60)

Le roi Pépin a cassé le Sceptre des Saisons. Une équipe de trois héros (Bastien le guerrier, Lulu la mage, Pia la rôdeuse) parcourt le royaume pour récupérer les éclats, gardés par des champions d'arène.

## Ce qu'il y a dans le jeu

- **Combats tactiques en deux phases** : vous faites agir vos 3 héros dans l'ordre que vous voulez (héros, capacité, cible), puis les monstres répondent. Dégâts estimés affichés avant de taper, esquive selon la vitesse, combat automatique et vitesse ×2.
- **4 capacités par héros, de types différents**, comme dans Pokémon. Les héros en apprennent plus en montant de niveau ou auprès des maîtres d'armes, et choisissent lesquelles emporter. 6 types (Neutre, Feu, Eau, Plante, Foudre, Roche).
- **Équipement** : la puissance de l'arme s'ajoute à chaque capacité, une arme élémentaire donne son type à l'attaque de base, les objets tenus (Charbon ardent, Perle d'eau…) renforcent un type. 4 raretés, bonus tirés au hasard, forge et atelier d'enchantement.
- **3 villes avec leurs bâtiments** : boutique, auberge, arène, maître d'armes partout ; boulangerie (repas pour 3 combats) à Bourg-Brioche, expéditions en mer à Port-Gougère, atelier d'enchantement à Fort-Cramoisi.
- **12 monstres et 3 champions** avec une mécanique propre (spores, renfort à mi-vie, changement de type).
- **Voyages chronométrés** façon Clash of Clans (15 min puis 3 h), avec un carnet de route à l'arrivée.
- **Campement** : mine d'or, terrain d'entraînement, herboristerie et forge, un seul chantier à la fois.

Les anciennes sauvegardes sont mises à niveau automatiquement (`migrer` dans `src/engine/game.js`).

Pas de serveur ni de base de données : la partie est sauvegardée dans le navigateur (`localStorage`).

## Développer

```bash
npm install
npm run dev          # jeu en local
npm test             # tests du moteur
npm run simulation   # 30 parties jouées par une IA, pour vérifier l'équilibrage
npm run e2e          # parcours complet dans un navigateur mobile (Playwright, aperçu lancé sur le port 4174)
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
