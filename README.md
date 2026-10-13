# Royaume de Poche

RPG d'aventure solo, pensé pour le téléphone et joué dans le navigateur. Troisième jeu du studio Cosmoth.

En ligne : https://royaume-de-poche.vercel.app (mode test : https://royaume-de-poche.vercel.app/?vitesse=60)

Le roi Pépin a cassé le Sceptre des Saisons. Une équipe de trois héros (Bastien le guerrier, Lulu la mage, Pia la rôdeuse) parcourt le royaume pour récupérer les éclats, gardés par des champions d'arène.

## Ce qu'il y a dans le jeu

- **Combats tactiques à intentions** : chaque monstre annonce son action et sa cible avant votre tour (dégâts estimés compris). Les champions et les élites **préparent** une grosse attaque un tour à l'avance. Vous faites agir vos 3 héros dans l'ordre que vous voulez, puis les monstres répondent. Combat automatique et vitesse ×2.
- **Héros spécialisés** : Bastien (neutre/roche) interrompt à coup sûr, provoque et ouvre la garde (« exposé » : +30 % pour l'allié suivant) ; Lulu (feu/eau) attaque et soigne ; Pia (plante/foudre) frappe vite et fort. 4 capacités emportées (5 avec la Bibliothèque), certaines avec un temps de recharge.
- **Zones en parcours** : 6 cases jouées dans l'ordre (3 combats, un feu de camp, un élite, le champion). Les PV ne remontent pas entre les combats ; en cas de défaite, on reprend au dernier point de passage. Chaque case ne rapporte qu'une fois. La chasse libre reste ouverte pour s'entraîner.
- **Routes jouables** : entre deux villes, la route est un parcours de même forme. Aucune attente.
- **Village façon Clash of Clans** : Château (plafonne les autres bâtiments et débloque les nouveaux), mine d'or, herboristerie, atelier (améliorer et relancer l'équipement), caserne, remparts, bibliothèque, hutte du bâtisseur (second ouvrier). Constructions avec de l'or et du temps.
- **Butin façon Diablo** : 4 raretés, bonus tirés au hasard, et des armes légendaires à pouvoir (Lame du Contre, Sceptre de l'Écho, Arc du Chasseur).
- **3 villes** avec boutique, auberge (repos et repas offerts), maître d'armes ; expéditions en mer à Port-Gougère.
- **Une vraie fin**, puis un **défi du jour** : un champion déjà battu, une règle tirée de la date, un record local en nombre de tours.

Les anciennes sauvegardes sont mises à niveau automatiquement (`migrer` dans `src/engine/game.js`), avec remboursement de ce qui a disparu.

Pas de serveur ni de base de données : la partie est sauvegardée dans le navigateur (`localStorage`).

## Développer

```bash
npm install
npm run dev          # jeu en local
npm test             # tests du moteur
npm run simulation   # 30 parties jouées par une IA, pour vérifier l'équilibrage
                     # (VILLAGE=1 : l'IA investit aussi dans le village)
npm run e2e          # parcours complet dans un navigateur mobile (Playwright, aperçu lancé sur le port 4174)
```

**Mode test** : ajouter `?vitesse=60` à l'adresse fait passer le temps du jeu 60 fois plus vite (chantiers, production, expéditions). `?vitesse=1` revient à la normale.

## Organisation

- `src/data/` : tout le contenu (héros, monstres, villes, objets, campement, dialogues). C'est là qu'on ajoute des monstres ou une ville.
- `src/engine/` : les règles, sans interface (combat, butin, progression, voyages). Testables avec Node.
- `src/ui/` : les écrans React.
- `art/manifest.txt` : liste des illustrations (nom + lien de génération). Une action GitHub les télécharge dans `art/src/`.
- `scripts/preparer-art.py` : détoure les personnages et convertit tout en WebP dans `public/art/`.

## Ajouter une illustration

Les bâtiments du village (château, caserne, remparts, bibliothèque, hutte) ont été générés par Codex dans le style des autres, et déposés directement dans `art/src/`.

1. Ajouter une ligne `nom lien` dans `art/manifest.txt` et pousser : l'action « Récupérer les illustrations » télécharge l'image dans `art/src/`.
2. `git pull`, puis `npm run art` pour générer le WebP dans `public/art/`.
