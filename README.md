# 2KR: AFTERMATH — Prototype navigateur

## Lancer le jeu
1. Décompressez le ZIP.
2. Ouvrez `index.html` dans un navigateur moderne (Chrome, Edge, Firefox ou Safari).
3. Une connexion Internet est nécessaire pour charger Three.js depuis le CDN.
4. Cliquez sur **DÉPLOYER** puis cliquez dans la zone du jeu si la souris n'est pas capturée.

## Contrôles
- `W A S D` : déplacement
- Souris : regarder
- Clic gauche : tirer
- `E` : récupérer une balise proche
- `V` : basculer FPS / TPS
- `Shift` : courir
- `R` : recharger
- `Échap` : libérer la souris

## Contenu actuel
- Environnement 3D urbain léger généré à la volée
- Contrôles FPS/TPS, course et endurance
- Arme de démonstration, munitions et cibles d'entraînement
- Trois balises à récupérer
- HUD tactique et messages de mission

## Limites honnêtes
C'est un prototype solo local : le mode multijoueur massif n'est pas encore implémenté. Il faut ensuite ajouter un serveur autoritaire, comptes/sessions, synchronisation des joueurs, anti-triche, matchmaking et optimisation réseau. Les graphismes sont volontairement simples pour rester fluides. Il s'agit d'une base jouable, pas d'un jeu AAA terminé.

## Structure
- `index.html` : interface et canvas
- `style.css` : HUD et écran de déploiement
- `game.js` : scène 3D, déplacement, tir et objectifs
