# MorpionXD

Le morpion en toutes dimensions — HTML/CSS/JavaScript pur, aucune dépendance,
aucun build. Un menu unique donne accès aux trois versions.

## Lancer le jeu

Ouvrir `morpion-xd/index.html` dans un navigateur : c'est le menu, il donne
accès aux trois jeux.

## Les 3 jeux

### Morpion 2D (`morpion-xd/2d/`)
Tic-tac-toe classique avec deux modes :
- **2 joueurs** sur le même écran
- **Contre l'IA** avec 3 niveaux : facile (aléatoire), moyen, difficile (minimax, imbattable)

### Morpion 3D (`morpion-xd/3d/`)
La même règle en 3×3×3 : 27 cases réparties sur 3 étages, victoire si 3 pions
forment une ligne droite dans le cube — 49 lignes au total : 27 sur les axes
(lignes, colonnes, piliers), 18 diagonales de faces, 4 grandes diagonales du
cube.
- **2 joueurs** sur le même écran
- **Contre l'IA** avec 3 niveaux : facile, moyen, difficile
  (élagage alpha-bêta, approfondissement itératif avec budget de temps,
  détection des coups gagnants/blocages immédiats)
- Rendu cube en CSS 3D : caméra orbitale à la souris/tactile, zoom molette,
  vue à plat (3 étages côte à côte)

### Morpion 4D (`morpion-xd/4d/`)
La règle étendue à l'hypercube 3×3×3×3 : 81 cases affichées en 3 hyperplans,
chacun contenant 3 étages de 9 cases. Victoire si 3 pions forment une ligne
droite en 4 dimensions — 272 lignes gagnantes au total :
- 108 axes (4 directions de coordonnées)
- 108 diagonales de plans
- 48 diagonales 3D
- 8 grandes diagonales de l'hypercube

Mode **2 joueurs** sur le même écran. Le dernier coup joué est encadré pour
s'y retrouver parmi les 81 cases. Trois vues : **à plat** (3 hyperplans ×
3 étages), **3D** (3 cubes côte à côte, caméra orbitale + zoom) et **4D**
(projection tesseract : 3 cubes concentriques).

### Morpion 5D (`morpion-xd/5d/`)
La règle étendue au penteracte 3×3×3×3×3 : 243 cases, victoire si 3 pions
forment une ligne droite en 5 dimensions — 1441 lignes gagnantes au total :
- 405 axes (5 directions de coordonnées)
- 540 diagonales de plans
- 360 diagonales 3D
- 120 diagonales 4D
- 16 grandes diagonales du penteracte

Mode **2 joueurs** sur le même écran. Le plateau se lit comme 3 couches (v=0,
v=1, v=2), chacune étant un plateau 4D complet. Trois vues, chacune « triple »
de celle du 4D :
- **à plat** : 3 couches côte à côte, chacune en 3 hyperplans × 3 étages
- **3D** : 9 cubes (3 rangées de 3, une rangée par couche), caméra orbitale + zoom
- **4D** : 3 tesseracts côte à côte (cubes concentriques par hyperplan)
