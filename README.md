# Mon jeu

Petits jeux web en HTML/CSS/JavaScript pur — aucune dépendance, aucun build.

## Jeux

### 2048 (`2048/`)
Fusionne les tuiles pour atteindre 2048.
- Contrôles : flèches, ZQSD, glissement tactile
- Score et record sauvegardés (localStorage)

### Morpion (`morpion/`)
Tic-tac-toe classique avec deux modes :
- **2 joueurs** sur le même écran
- **Contre l'IA** avec 3 niveaux : facile (aléatoire), moyen, difficile (minimax, imbattable)

### Morpion 3D (`morpion-3d/`)
La même règle en 3×3×3 : 27 cases réparties sur 3 étages, victoire si 3 pions
sont alignés sur l'un des 3 axes (lignes, colonnes ou piliers verticaux).
- **2 joueurs** sur le même écran
- **Contre l'IA** avec 3 niveaux : facile, moyen, difficile
  (élagage alpha-bêta avec profondeur adaptative et heuristique sur les lignes)

## Lancer un jeu

Ouvrir le `index.html` du dossier choisi dans un navigateur. C'est tout.
