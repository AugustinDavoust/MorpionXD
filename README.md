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
forment une ligne droite dans le cube — 49 lignes au total : 27 sur les axes
(lignes, colonnes, piliers), 18 diagonales de faces, 4 grandes diagonales du
cube.
- **2 joueurs** sur le même écran
- **Contre l'IA** avec 3 niveaux : facile, moyen, difficile
  (élagage alpha-bêta, approfondissement itératif avec budget de temps,
  détection des coups gagnants/blocages immédiats)

## Lancer un jeu

Ouvrir le `index.html` du dossier choisi dans un navigateur. C'est tout.
