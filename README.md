# Siam

Version web du jeu de plateau **Siam** pour deux joueurs, en HTML, CSS et JavaScript, sans dépendance ni étape de compilation.

Deux camps s’affrontent : les **Éléphants** (bleu) et les **Rhinocéros** (rouge). Ils se poussent, s’orientent et se neutralisent autour de trois rochers. Le premier à faire sortir un rocher du plateau remporte la partie, à condition d’être le mieux placé pour le pousser.

## Lancer le jeu

Ouvrir `page.html` dans un navigateur. Le jeu se joue à deux sur le même écran ; les Éléphants commencent.

```
siam/
├── page.html      structure de la page et panneau de commandes
├── style.css      mise en page et habillage
├── script2.js     règles et logique de jeu
└── assets/
    ├── plateau.png                fond du plateau
    ├── Bleu0.png … Bleu4.png      Éléphants
    ├── Rouge0.png … Rouge4.png    Rhinocéros
    ├── Caillou1.png … Caillou4.png  rochers (tirés au hasard à chaque partie)
    └── croix.png                  cases interdites en début de partie
```

## Le plateau

La zone de jeu fait 5 × 5 cases. Chaque camp dispose d’un banc de 5 animaux : celui des Rhinocéros en haut, celui des Éléphants en bas. Les trois rochers occupent le centre de la rangée médiane.

Un animal est orienté dans une des quatre directions. Cette orientation fixe le sens dans lequel il peut pousser et compte dans le calcul des forces.

## Jouer un tour

À chaque tour, un seul animal effectue une seule de ces actions :

| Action | Comment |
| --- | --- |
| Entrer sur le plateau | Sélectionner un animal du banc, puis cliquer une case de bord. |
| Se déplacer | Cliquer une case libre voisine, en orthogonal. L’animal peut ensuite être réorienté librement. |
| Changer d’orientation | Utiliser les flèches : l’animal tourne sans quitter sa case. |
| Sortir du plateau | Sélectionner un animal posé sur une case de bord, puis « Sortir le pion ». Il retourne sur son banc. |
| Pousser | Cliquer la case occupée située devant l’animal sélectionné, qui doit être tourné vers elle. |

Une fois l’action jouée, « Terminer le tour » passe la main à l’adversaire. Une poussée termine le tour automatiquement.

Les cases marquées d’une croix sont interdites pendant les deux premiers coups de chaque joueur.

## Les poussées

Une poussée déplace d’une case toute la file de pièces contiguës située devant le pousseur. Pour qu’elle réussisse :

- chaque animal de la file orienté dans le sens de la poussée ajoute 1 à la force, y compris le pousseur ;
- chaque animal qui fait face à la poussée retire 1, quel que soit son camp ;
- les animaux orientés de côté n’ont aucun effet ;
- la force finale doit être d’au moins 1 et au moins égale au nombre de rochers dans la file.

Un animal poussé hors du plateau n’est pas éliminé : il retourne sur son banc. Un animal ne peut pas changer d’orientation pendant une poussée.

Une poussée peut aussi se faire à l’entrée : l’animal arrive depuis son banc par une case de bord déjà occupée, orienté vers l’intérieur du plateau. Les coins n’autorisent pas ce type de poussée.

## Fin de partie

La partie s’arrête dès qu’un rocher sort du plateau. Le vainqueur est le joueur dont l’animal est le plus proche du rocher éjecté, parmi ceux qui sont orientés dans le sens de la poussée. Ce n’est donc pas forcément celui qui a joué le dernier coup.

## Organisation du code

L’état de la partie tient dans un seul objet `S` :

- `grille` : tableau 5 × 5 contenant `null`, un animal ou un rocher ;
- `banc` : les animaux de chaque camp qui ne sont pas sur le plateau, indexés par leur numéro ;
- `tour`, `coups` : camp actif et nombre de coups joués ;
- `sel`, `action` : animal sélectionné et action déjà jouée pendant le tour ;
- `fin` : camp vainqueur, ou `null`.

Les fonctions principales de `script2.js` :

- `cibles()` liste les destinations et poussées possibles pour l’animal sélectionné ;
- `ligne()` et `poussable()` repèrent la file de pièces concernée et vérifient la règle des forces ;
- `appliquerPoussee()` décale la file, renvoie les animaux éjectés sur leur banc et désigne le vainqueur si un rocher sort ;
- `render()` redessine le plateau à partir de l’état, sans jamais le lire dans le DOM.

Les quatre directions (haut, droite, bas, gauche) sont traitées par la même table de vecteurs `DIRS`, ce qui évite de dupliquer la logique de poussée.

## Pistes d’amélioration

- Jouer contre l’ordinateur.
- Plateau verso et variante à 4 animaux par camp.
- Limiter à une fois par joueur la sortie d’un animal.
- Annuler un coup avant de terminer le tour.

## Crédits et droits

Projet universitaire à but pédagogique, sans aucun usage commercial, réalisé dans le cadre de cours Javascript, Faculté des Sciences Jean Perrin, 2e année.

- **Jeu :** Siam est un jeu de société dont les droits appartiennent à ses auteurs et à son éditeur. Ce projet n’est ni affilié à eux ni approuvé par eux.
- **Illustrations :** Siam. Elles restent la propriété de leurs détenteurs et ne sont pas couvertes par la licence du code.
- **Code :** © Enrik Pashaj, tous droits réservés.

Pour toute demande de retrait, contacter [adresse e-mail].